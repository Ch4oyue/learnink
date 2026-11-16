// Ordering guardrails for the Edge Function auth fixes.
//
// These two checks are deliberately source-level: `requireRole` calls
// `supabase.auth.getUser()` against the live Auth server, so "authentication
// runs before the body is consumed" cannot be executed without network
// credentials. What they assert is the property that matters — the guard
// precedes the first untrusted read — and they fail if either call is moved
// below the other.
//
// Everything else in this directory is behavioural: `client_ip.test.ts` drives
// the real helper, `user_role_protection.behavior.test.ts` drives the real
// mutation functions against scripted clients. Do not add `toContain` string
// assertions here; if a property cannot be executed, say so in the test name.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("award-xp authenticates before consuming the request body", () => {
  const src = read("supabase/functions/award-xp/index.ts");
  const guard = src.indexOf("await requireRole(req, null, corsHeaders)");
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
