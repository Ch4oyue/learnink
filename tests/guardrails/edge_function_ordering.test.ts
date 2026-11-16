// Source-pattern guardrails for the Edge Function auth fixes (repo guardrail style).
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("award-xp authenticates before consuming the request body", () => {
  const src = read("supabase/functions/award-xp/index.ts");
  const guard = src.indexOf("requireRole(req, null, corsHeaders)");
  const parse = src.indexOf("await req.json()");
  expect(guard).toBeGreaterThan(-1);
  expect(parse).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(parse);
});

test("generate-quiz authenticates before the rate-limit RPC", () => {
  const src = read("supabase/functions/generate-quiz/index.ts");
  const serveBody = src.slice(src.indexOf("serve(async"));
  const guard = serveBody.indexOf("await requireRole(");
  const rateLimit = serveBody.indexOf("await checkRateLimit(");
  expect(guard).toBeGreaterThan(-1);
  expect(rateLimit).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(rateLimit);
});

test("rolesOf throws on missing configuration and on query error (no silent [])", () => {
  const src = read("supabase/functions/_shared/auth.ts");
  expect(src).toContain('throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured")');
  expect(src).toContain("throw new Error(`Role lookup failed: ${error.message}`)");
  // No fail-open returns of an empty role list on the error paths.
  const rolesOfBody = src.slice(src.indexOf("async function rolesOf"), src.indexOf("export async function requireRole"));
  expect(rolesOfBody).not.toContain("return [];");
});

test("rolesOf validates roles against the AppRole union (no blind cast)", () => {
  const src = read("supabase/functions/_shared/auth.ts");
  expect(src).toContain("APP_ROLES");
  // The mapping must filter through the union, not reassert with `as AppRole`.
  expect(src).not.toContain("row.role as AppRole");
});

test("requireRole logs the swallowed lookup error server-side", () => {
  const src = read("supabase/functions/_shared/auth.ts");
  expect(src).toContain("console.error(");
  expect(src).not.toContain("} catch {");
});

test("requireRole maps a failed role lookup to 500, not 403", () => {
  const src = read("supabase/functions/_shared/auth.ts");
  expect(src).toContain('jsonError(500, "Role lookup failed", corsHeaders)');
});

test("clientIp normalizes empty results to unknown on both header paths", () => {
  const src = read("supabase/functions/_shared/client-ip.ts");
  expect(src).toContain('stripPort(hops[hops.length - 1]) || "unknown"');
  expect(src).toContain('stripPort(stripQuotes(realIp)) || "unknown"');
});
