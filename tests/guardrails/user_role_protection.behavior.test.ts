// The hooks are called at the top level on purpose: the point of this file is
// to capture the `mutationFn` each hook registers, not to render anything.
/* eslint-disable react-hooks/rules-of-hooks */
import { describe, test, expect, mock } from "bun:test";

// Behavioral tests for the super-admin guards in useUserRole.ts. The supabase
// client and react-query are mocked so the real mutationFn code executes
// against scripted table responses: multi-row roles, lookup errors, and
// non-admin users. These prove client-side behavior only — the authoritative
// boundary remains the database RLS policies (not covered here).

type TableResult = { data?: unknown; error?: { message: string } | null };

let tableResults: Record<string, TableResult> = {};
let profilesUpdates: Array<Record<string, unknown>> = [];

function chain(table: string) {
  const self: Record<string, unknown> = {};
  const finish = () => tableResults[table] ?? { data: null, error: null };
  self.select = () => self;
  self.eq = () => self;
  self.update = (patch: Record<string, unknown>) => {
    if (table === "profiles") profilesUpdates.push(patch);
    return self;
  };
  // thenable so `await supabase.from(...).select(...).eq(...)` resolves
  (self as { then?: unknown }).then = (resolve: (v: TableResult) => unknown) =>
    Promise.resolve(finish()).then(resolve);
  return self;
}

const mutationConfigs: Array<{ mutationFn: (v: never) => Promise<unknown> }> = [];

mock.module("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => chain(table) },
}));
mock.module("@/hooks/use-toast", () => ({ useToast: () => ({ toast: () => {} }) }));
mock.module("@/lib/logger", () => ({ logger: { error: () => {} } }));
mock.module("@/contexts/AuthContext", () => ({}));
mock.module("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null }),
  useMutation: (cfg: { mutationFn: (v: never) => Promise<unknown> }) => {
    mutationConfigs.push(cfg);
    return { mutate: () => {}, isPending: false };
  },
  useQueryClient: () => ({ invalidateQueries: () => {} }),
}));

const { useUpdateUserRole, useBanUser } = await import("@/hooks/useUserRole");
useUpdateUserRole();
useBanUser();
const [updateCfg, banCfg] = mutationConfigs;

describe("super-admin guards (executed behavior)", () => {
  test("ban: multi-row superadmin is still protected (old .single() silently skipped this)", async () => {
    tableResults = { user_roles: { data: [{ role: "superadmin" }, { role: "admin" }], error: null } };
    await expect(
      banCfg.mutationFn({ userId: "u1", banDuration: "24h" } as never),
    ).rejects.toThrow("Super Admin tidak dapat di-ban");
    expect(profilesUpdates.length).toBe(0);
  });

  test("ban: role lookup error fails closed instead of skipping the guard", async () => {
    tableResults = { user_roles: { data: null, error: { message: "db down" } } };
    await expect(
      banCfg.mutationFn({ userId: "u1", banDuration: "7d" } as never),
    ).rejects.toThrow("Gagal memeriksa peran pengguna");
    expect(profilesUpdates.length).toBe(0);
  });

  test("ban: ordinary multi-row user is banned normally", async () => {
    profilesUpdates = [];
    tableResults = {
      user_roles: { data: [{ role: "admin" }, { role: "user" }], error: null },
      profiles: { data: null, error: null },
    };
    const result = (await banCfg.mutationFn({ userId: "u1", banDuration: "24h" } as never)) as {
      bannedUntil: string | null;
    };
    expect(result.bannedUntil).toBeTruthy();
    expect(profilesUpdates.length).toBe(1);
  });

  test("ban: unban clears banned_until", async () => {
    profilesUpdates = [];
    tableResults = {
      user_roles: { data: [{ role: "user" }], error: null },
      profiles: { data: null, error: null },
    };
    const result = (await banCfg.mutationFn({ userId: "u1", banDuration: "unban" } as never)) as {
      bannedUntil: string | null;
    };
    expect(result.bannedUntil).toBeNull();
  });

  test("update: multi-row superadmin cannot be demoted", async () => {
    tableResults = { user_roles: { data: [{ role: "user" }, { role: "superadmin" }], error: null } };
    await expect(
      updateCfg.mutationFn({ userId: "u1", newRole: "admin" } as never),
    ).rejects.toThrow("Super Admin role bersifat permanen");
  });

  test("update: role lookup error fails closed", async () => {
    tableResults = { user_roles: { data: null, error: { message: "rls" } } };
    await expect(
      updateCfg.mutationFn({ userId: "u1", newRole: "admin" } as never),
    ).rejects.toThrow("Gagal memeriksa peran pengguna");
  });

  test("update: promotion to superadmin stays blocked", async () => {
    tableResults = { user_roles: { data: [{ role: "user" }], error: null } };
    await expect(
      updateCfg.mutationFn({ userId: "u1", newRole: "superadmin" } as never),
    ).rejects.toThrow("Tidak dapat mengubah pengguna menjadi Super Admin");
  });
});
