// Shared authentication / authorization helpers for Edge Functions.
//
// Every privileged function must:
//   1. Verify the caller's JWT (authenticate)
//   2. Resolve the caller's role from `user_roles` (getUserRoles)
//   3. Reject anyone that is not explicitly allowed (hasRole)
//
// Never trust a role sent by the client and never rely on `verify_jwt` alone:
// `verify_jwt = true` only proves the caller is *some* signed-in user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AppRole = "user" | "tutor" | "admin" | "superadmin";

export const ADMIN_ROLES: AppRole[] = ["admin", "superadmin"];
export const STAFF_ROLES: AppRole[] = ["tutor", "admin", "superadmin"];

function getBearerToken(req: Request): string | null {
  // Headers.get is case-insensitive, so one lookup covers every casing.
  const header = req.headers.get("Authorization");
  if (!header) return null;

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Verifies the request's JWT server-side and returns the caller's user id.
 * Returns `userId: null` when the token is missing, malformed or expired.
 */
export async function authenticate(
  req: Request,
): Promise<{ userId: string | null; error: string | null }> {
  const token = getBearerToken(req);
  if (!token) {
    return { userId: null, error: "Missing or invalid Authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return { userId: null, error: "Server configuration error" };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  // getUser(jwt) validates the token against the Auth server, it does not
  // decode it locally.
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return { userId: null, error: "Invalid or expired token" };
  }

  return { userId: user.id, error: null };
}

/**
 * Reads a user's roles with the service-role client (`user_roles` is not
 * readable through RLS). Returns `[]` on any failure, so callers deny access
 * by default instead of failing open.
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return [];
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((row: { role: string }) => row.role as AppRole);
}

export function hasRole(roles: AppRole[], allowed: AppRole[]): boolean {
  return roles.some((role) => allowed.includes(role));
}
