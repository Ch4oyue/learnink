import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

// Guardrail: the super-admin protections in useUserRole.ts must read ALL role
// rows and fail closed. `.single()` throws when a user holds multiple role
// rows (the schema allows it; the server-side rolesOf() returns an array), and
// the old code ignored that error — silently skipping the protection.
// Scoped to the guard region: the later .update().select().single() is fine,
// it writes one row and surfaces its own error.
describe("user_roles protection guardrails", () => {
  const content = readFileSync(join(process.cwd(), "src/hooks/useUserRole.ts"), "utf-8");
  const updateGuard = content.split("useUpdateUserRole")[1]?.split("Prevent promoting any user to superadmin")[0] ?? "";
  const banGuard = content.split("useBanUser")[1]?.split("Calculate ban end time")[0] ?? "";

  test("super-admin guards read all rows (no .single()) and use membership", () => {
    expect(updateGuard).not.toContain(".single()");
    expect(banGuard).not.toContain(".single()");
    expect(updateGuard).toContain(".includes('superadmin')");
    expect(banGuard).toContain(".includes('superadmin')");
  });

  test("role lookup errors are thrown (fail closed)", () => {
    expect(updateGuard).toContain("if (roleError) throw");
    expect(banGuard).toContain("if (roleError) throw");
  });
});
