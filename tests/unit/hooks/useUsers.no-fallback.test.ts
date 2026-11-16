import { describe, it, expect, mock, beforeAll } from "bun:test";

// Regression test: useUsers must not fall back to a direct profiles /
// user_roles query when the get-users Edge Function fails. That function is the
// admin boundary; the old fallback silently degraded to a client-side read and
// so bypassed the boundary whenever it errored — including the 403 the function
// returns to non-admins.

let invoke: () => Promise<{ data: unknown; error: unknown }>;
let capturedQueryFn: (() => Promise<unknown>) | undefined;
const fromCalls: string[] = [];

mock.module("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: () => invoke() },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    from: (table: string) => {
      fromCalls.push(table);
      throw new Error(`direct query on ${table} must not run`);
    },
  },
}));
mock.module("@/lib/realtime", () => ({ uniqueChannelTopic: (t: string) => t }));
mock.module("@/contexts/AuthContext", () => ({}));
mock.module("react", () => ({ useEffect: () => {} }));
mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: () => {} }),
  useQuery: (cfg: { queryFn: () => Promise<unknown> }) => {
    capturedQueryFn = cfg.queryFn;
    return { data: undefined, isLoading: false, error: null };
  },
}));

let useUsers: typeof import("../../../src/hooks/useUsers").useUsers;

beforeAll(async () => {
  useUsers = (await import("../../../src/hooks/useUsers")).useUsers;
});

describe("useUsers admin boundary", () => {
  it("surfaces an Edge Function failure instead of querying the client", async () => {
    invoke = () => Promise.resolve({ data: null, error: { message: "Forbidden" } });
    useUsers();
    await expect(capturedQueryFn!()).rejects.toThrow("Forbidden");
    expect(fromCalls).toEqual([]);
  });

  it("returns the Edge Function payload untouched", async () => {
    const payload = { users: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    invoke = () => Promise.resolve({ data: payload, error: null });
    useUsers();
    await expect(capturedQueryFn!()).resolves.toBe(payload);
    expect(fromCalls).toEqual([]);
  });

  it("rejects an empty payload instead of inventing an empty list", async () => {
    invoke = () => Promise.resolve({ data: null, error: null });
    useUsers();
    await expect(capturedQueryFn!()).rejects.toThrow("no users payload");
    expect(fromCalls).toEqual([]);
  });
});
