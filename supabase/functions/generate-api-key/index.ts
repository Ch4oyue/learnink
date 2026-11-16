import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsFor, preflight } from "../_shared/cors.ts";
import { requireRole, ADMIN_ROLES } from "../_shared/auth.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// =============================================
// ENVIRONMENT & CONFIG
// =============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// =============================================
// TYPES
// =============================================

interface GenerateKeyRequest {
    name: string;
    source: "n8n" | "notion" | "chatgpt" | "zapier" | "custom";
    description?: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function generateApiKey(): string {
    // Generate a secure random API key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    // Convert to base64 and make URL-safe
    const base64 = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    return `sk_live_${base64}`;
}

function createKeyPreview(key: string): string {
    // Create masked preview: sk_live_••••••••xxxx (last 4 chars visible)
    const lastChars = key.slice(-4);
    return `sk_live_${"•".repeat(8)}${lastChars}`;
}

// =============================================
// MAIN HANDLER
// =============================================

serve(async (req) => {
    const corsHeaders = corsFor(req);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return preflight(req);
    }

    // Only accept POST
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed", success: false }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        if (!SUPABASE_SERVICE_ROLE_KEY) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
            return new Response(
                JSON.stringify({ error: "Server configuration error", success: false }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // -------------------------
        // 1. Verify User Authorization
        // -------------------------
        // Roles are resolved from `user_roles` only. Never identify an admin by a
        // hardcoded email or user id: that is a permanent backdoor in the source
        // and breaks as soon as the account is renamed or the row is removed.
        const guard = await requireRole(req, ADMIN_ROLES, corsHeaders, "Admin access required");
        if (!guard.ok) return guard.response;
        const userId = guard.userId;

        // Service-role client for the key insert below.
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // -------------------------
        // 3. Parse and Validate Request
        // -------------------------
        let body: GenerateKeyRequest;
        try {
            body = await req.json();
        } catch {
            return new Response(
                JSON.stringify({ error: "Invalid JSON body", success: false }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "'name' is required", success: false }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const validSources = ["n8n", "notion", "chatgpt", "zapier", "custom"];
        if (!body.source || !validSources.includes(body.source)) {
            return new Response(
                JSON.stringify({ error: `'source' must be one of: ${validSources.join(", ")}`, success: false }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // -------------------------
        // 4. Generate API Key
        // -------------------------
        const apiKey = generateApiKey();
        const apiKeyPreview = createKeyPreview(apiKey);

        // Hash the key with bcrypt
        console.log("Hashing API key with bcrypt...");
        let apiKeyHash: string;
        try {
            apiKeyHash = await bcrypt.hash(apiKey);
        } catch (bcryptError) {
             console.error("Bcrypt hashing failed:", bcryptError);
             return new Response(
                JSON.stringify({ error: "Failed to secure API key", success: false }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Generating integration: ${body.name} (${body.source})`);

        // -------------------------
        // 5. Create Webhook URL
        // -------------------------
        const webhookUrl = `${SUPABASE_URL}/functions/v1/ingest-content`;

        // -------------------------
        // 6. Insert into Database (using service role to bypass RLS)
        // -------------------------
        const { data: integration, error: insertError } = await supabaseAdmin
            .from("integrations")
            .insert({
                name: body.name.trim().substring(0, 100),
                description: body.description?.trim().substring(0, 500) || null,
                source: body.source,
                api_key_hash: apiKeyHash,
                api_key_preview: apiKeyPreview,
                webhook_url: webhookUrl,
                is_active: true,
                created_by: userId,
            })
            .select("id, name, source, api_key_preview, webhook_url, is_active, created_at")
            .single();

        if (insertError) {
            console.error("Database error:", insertError);
            return new Response(
                JSON.stringify({
                    error: `Failed to create integration: ${insertError.message}`,
                    success: false
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Integration created: ${integration.id}`);

        // -------------------------
        // 7. Return Response with FULL KEY (only time it's shown!)
        // -------------------------
        return new Response(
            JSON.stringify({
                success: true,
                message: "Integration created successfully. Save the API key - it won't be shown again!",
                integration: {
                    id: integration.id,
                    name: integration.name,
                    source: integration.source,
                    webhook_url: integration.webhook_url,
                    is_active: integration.is_active,
                    created_at: integration.created_at,
                },
                api_key: apiKey, // FULL KEY - Only shown once!
                api_key_preview: apiKeyPreview,
            }),
            {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in generate-api-key function:", error);

        return new Response(
            JSON.stringify({ error: errorMessage, success: false }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
