import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsFor, preflight } from "../_shared/cors.ts";
import { requireRole, ADMIN_ROLES } from "../_shared/auth.ts";

serve(async (req) => {
  const corsHeaders = corsFor(req);

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return preflight(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100); // Hardcap at 100
    const search = url.searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    // Admin-only: the guard verifies the JWT, then the role in `user_roles`.
    const guard = await requireRole(req, ADMIN_ROLES, corsHeaders, "Forbidden: Admin access required");
    if (!guard.ok) return guard.response;

    // Service-role client for the privileged reads below.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Fetch Data (using Admin Client)
    // Fetch profiles with pagination and search
    let query = supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, created_at, labels, points, is_premium, premium_until", { count: "exact" });

    if (search) {
      query = query.ilike("display_name", `%${search}%`);
    }

    const { data: initialProfiles, error: profilesError, count: initialCount } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    let profiles = initialProfiles;
    let count = initialCount;

    if (profilesError) {
      console.warn("Failed to fetch full profiles in edge function, falling back to basic fields", profilesError);
      // Fallback to basic fields
      const basicQuery = supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url, created_at", { count: "exact" });

      const { data: basicData, error: basicError, count: basicCount } = await basicQuery
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (basicError) throw basicError;
      profiles = basicData;
      count = basicCount;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) throw rolesError;

    // Map roles
    const roleMap = new Map();
    roles?.forEach((r) => roleMap.set(r.user_id, r.role));

    // Combine
    const users = profiles?.map((p) => ({
      ...p,
      role: roleMap.get(p.id) || "user",
    }));

    return new Response(
      JSON.stringify({
        users,
        meta: {
          page,
          limit,
          total: count,
          totalPages: count ? Math.ceil(count / limit) : 0
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
