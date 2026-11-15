import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { validatePayload, ValidationError } from "./validation.ts";

// =============================================
// ENVIRONMENT & CONFIG
// =============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Legacy shared secret for backward compatibility (optional)
const INGEST_SECRET = Deno.env.get("INGEST_SECRET");

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window
const RATE_LIMIT_WINDOW_MINUTES = 15; // Time window in minutes

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================
// TYPES
// =============================================

interface ValidatedIntegration {
    id: string;
    name: string;
    source: string;
}

// =============================================
// SECURITY LOGGING
// =============================================

async function logSecurityEvent(
    supabase: ReturnType<typeof createClient>,
    eventType: string,
    req: Request,
    errorCode: number,
    errorMessage: string,
    metadata: Record<string, unknown> = {}
): Promise<void> {
    try {
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        await supabase.rpc("log_security_event", {
            p_event_type: eventType,
            p_ip_address: ipAddress,
            p_user_agent: userAgent.substring(0, 500),
            p_endpoint: "/ingest-content",
            p_request_method: req.method,
            p_error_code: errorCode,
            p_error_message: errorMessage.substring(0, 500),
            p_metadata: metadata,
        });
    } catch (e) {
        console.warn("Failed to log security event:", e);
    }
}

// =============================================
// RATE LIMITING
// =============================================

async function checkRateLimit(
    supabase: ReturnType<typeof createClient>,
    req: Request
): Promise<boolean> {
    try {
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "unknown";

        const { data, error } = await supabase.rpc("check_rate_limit", {
            p_identifier: ipAddress,
            p_endpoint: "/ingest-content",
            p_max_requests: RATE_LIMIT_MAX_REQUESTS,
            p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
        });

        if (error) {
            console.warn("Rate limit check failed:", error);
            return true; // Allow request if check fails
        }

        return data === true;
    } catch (e) {
        console.warn("Rate limit error:", e);
        return true; // Allow request if check fails
    }
}

// =============================================
// API KEY VALIDATION
// =============================================

async function validateApiKey(
    supabase: ReturnType<typeof createClient>,
    token: string
): Promise<ValidatedIntegration | null> {
    // Check legacy INGEST_SECRET
    if (INGEST_SECRET && token === INGEST_SECRET) {
        return {
            id: "ingest-secret",
            name: "Ingest Secret (Legacy)",
            source: "n8n",
        };
    }

    // Check if token looks like an API key (sk_live_...)
    if (!token.startsWith("sk_live_")) {
        return null;
    }

    // Reconstruct the API key preview to filter integrations
    // Format: sk_live_••••••••xxxx
    const lastChars = token.slice(-4);
    const apiKeyPreview = `sk_live_${"•".repeat(8)}${lastChars}`;

    // Fetch ONLY integrations with matching preview and check against bcrypt hashes
    const { data: integrations, error } = await supabase
        .from("integrations")
        .select("id, name, source, api_key_hash")
        .eq("is_active", true)
        .eq("api_key_preview", apiKeyPreview);

    if (error || !integrations) {
        console.error("Error fetching integrations:", error);
        return null;
    }

    // Check the hash (should be 0 or 1 result, but loop is safe)
    for (const integration of integrations) {
        try {
            const isMatch = await bcrypt.compare(token, integration.api_key_hash);
            if (isMatch) {
                return {
                    id: integration.id,
                    name: integration.name,
                    source: integration.source,
                };
            }
        } catch (e) {
            console.error(`Error comparing hash for ${integration.id}:`, e);
        }
    }

    return null;
}

// =============================================
// UPDATE INTEGRATION STATS
// =============================================

async function updateIntegrationStats(
    supabase: ReturnType<typeof createClient>,
    integrationId: string
): Promise<void> {
    // Skip for the legacy shared secret
    if (integrationId === "ingest-secret") {
        return;
    }

    const { error } = await supabase.rpc("increment_integration_request_count", {
        integration_id: integrationId,
    }).catch(() => {
        // Fallback if RPC doesn't exist - do manual update
        return supabase
            .from("integrations")
            .update({
                last_used_at: new Date().toISOString(),
                request_count: supabase.raw("request_count + 1"),
            })
            .eq("id", integrationId);
    });

    if (error) {
        console.warn("Failed to update integration stats:", error);
    }
}

// =============================================
// MAIN HANDLER
// =============================================

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed", success: false }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // -------------------------
        // 1. Rate Limit Check
        // -------------------------
        const withinLimit = await checkRateLimit(supabase, req);
        if (!withinLimit) {
            await logSecurityEvent(supabase, "rate_limit_exceeded", req, 429, "Too many requests");
            return new Response(
                JSON.stringify({ error: "Too many requests. Please try again later.", success: false }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // -------------------------
        // 2. Validate Authorization
        // -------------------------
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            // Body might be empty or invalid, but we'll check token first
            body = {};
        }

        // Try to get token from Header OR Body
        let token = "";
        const authHeader = req.headers.get("Authorization");

        // Helper to safely access api_key from unknown body
        const getApiKeyFromBody = (b: unknown): string | null => {
            if (b && typeof b === 'object' && 'api_key' in b) {
                const key = (b as Record<string, unknown>).api_key;
                return typeof key === 'string' ? key : null;
            }
            return null;
        };

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.replace("Bearer ", "");
        } else {
            const bodyKey = getApiKeyFromBody(body);
            if (bodyKey) token = bodyKey;
        }

        if (!token) {
            await logSecurityEvent(supabase, "auth_failure", req, 401, "Missing API Key (Header or Body)");
            return new Response(
                JSON.stringify({ error: "Missing or invalid Authorization header", success: false }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate API key against integrations table or legacy keys
        const integration = await validateApiKey(supabase, token);

        if (!integration) {
            console.error("Invalid API key provided");
            // Never persist any fragment of the presented token, not even a prefix.
            await logSecurityEvent(supabase, "invalid_api_key", req, 403, "Invalid API key");
            return new Response(
                JSON.stringify({ error: "Unauthorized - Invalid API key", success: false }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Authenticated via: ${integration.name} (${integration.source})`);

        // -------------------------
        // 3. Parse and Validate Body
        // -------------------------
        // Body is already parsed above

        const payload = validatePayload(body);
        console.log("Received content:", payload.title);

        // -------------------------
        // 3. Insert into Database
        // -------------------------
        const insertData: Record<string, unknown> = {
            title: payload.title,
            raw_content: {
                content: payload.content,
                tags: payload.tags || [],
            },
            source: integration.source,
            status: "pending",
        };

        // Link to integration if it's not the legacy shared secret
        if (integration.id !== "ingest-secret") {
            insertData.integration_id = integration.id;
        }

        const { data, error } = await supabase
            .from("incoming_contents")
            .insert(insertData)
            .select("id")
            .single();

        if (error) {
            console.error("Database error:", error);
            throw new Error(`Failed to insert content: ${error.message}`);
        }

        console.log("Content inserted with ID:", data.id);

        // -------------------------
        // 4. Update Integration Stats
        // -------------------------
        await updateIntegrationStats(supabase, integration.id);

        // -------------------------
        // 5. Return Success Response
        // -------------------------
        return new Response(
            JSON.stringify({
                success: true,
                message: "Content received and queued for review",
                id: data.id,
                source: integration.source,
            }),
            {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in ingest-content function:", error);

        // Check if it's a validation error
        if (error instanceof ValidationError) {
            return new Response(
                JSON.stringify({ error: errorMessage, success: false }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        return new Response(
            JSON.stringify({ error: errorMessage, success: false }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
