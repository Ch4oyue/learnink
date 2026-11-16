// Shared authentication / authorization for Edge Functions.
//
// Every privileged function must resolve the caller from the JWT and check the
// role in `user_roles`. Never trust a role sent by the client, and never rely on
// `verify_jwt` alone: it only proves the caller is *some* signed-in user.
//
// Use `requireRole` for the whole guard — it returns either the caller's id or a
// ready-to-return error response, so a function needs three lines, not twenty.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AppRole = "user" | "tutor" | "admin" | "superadmin";

export const APP_ROLES: AppRole[] = ["user", "tutor", "admin", "superadmin"];

export const ADMIN_ROLES: AppRole[] = ["admin", "superadmin"];
export const STAFF_ROLES: AppRole[] = ["tutor", "admin", "superadmin"];

export type Guard =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

function jsonError(
  status: number,
  message: string,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: message, success: false }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** The caller's bearer token, or null when the header is missing or malformed. */
function bearerToken(req: Request): string | null {
  // Headers.get is case-insensitive, so one lookup covers every casing.
  const header = req.headers.get("Authorization");
  if (!header) return null;

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Roles held by a user, read with the service role (`user_roles` has no RLS read policy).
 *
 * Throws when the service configuration is missing or the lookup fails: returning
 * `[]` there would answer 403 ("no roles") for what is really a server fault and
 * mask the misconfiguration. Callers must turn the throw into a 500, not a denial.
 */
async function rolesOf(userId: string): Promise<AppRole[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Role lookup failed: ${error.message}`);
  }

  // Only values in the AppRole union are returned. Anything else means
  // corrupted user_roles data; drop it instead of propagating an invalid role.
  return (data ?? [])
    .map((row: { role: string }) => row.role)
    .filter((role): role is AppRole => (APP_ROLES as string[]).includes(role));
}

/**
 * Verifies the request's JWT and, when `allowed` is given, that the caller holds
 * one of those roles.
 *
 *   const guard = await requireRole(req, STAFF_ROLES, corsHeaders);
 *   if (!guard.ok) return guard.response;
 *   const userId = guard.userId;
 *
 * Pass `null` for `allowed` to require only a valid session. Both failure paths
 * return 401/403 with a CORS-carrying body, so callers never hand-build them.
 */
export async function requireRole(
  req: Request,
  allowed: AppRole[] | null,
  corsHeaders: Record<string, string>,
  forbiddenMessage = "Forbidden: insufficient role",
): Promise<Guard> {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false, response: jsonError(401, "Missing or invalid Authorization header", corsHeaders) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, response: jsonError(500, "Server configuration error", corsHeaders) };
  }

  // getUser(jwt) validates against the Auth server; it does not decode locally.
  // The anon client is enough — this must not run with the service role.
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);

  if (error || !user) {
    return { ok: false, response: jsonError(401, "Invalid or expired token", corsHeaders) };
  }

  if (allowed) {
    let callerRoles: AppRole[];
    try {
      callerRoles = await rolesOf(user.id);
    } catch (lookupError) {
      // A failed lookup is a server fault (500), not a denial (403).
      console.error("Role lookup failed", lookupError);
      return { ok: false, response: jsonError(500, "Role lookup failed", corsHeaders) };
    }
    if (!callerRoles.some((role) => allowed.includes(role))) {
      return { ok: false, response: jsonError(403, forbiddenMessage, corsHeaders) };
    }
  }

  return { ok: true, userId: user.id };
}
