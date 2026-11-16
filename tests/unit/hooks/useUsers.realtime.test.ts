/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, mock, beforeEach, beforeAll } from "bun:test";

// Regression test for the admin dashboard crash:
// "cannot add `postgres_changes` callbacks for realtime:users-profiles-changes
// after `subscribe()`".
//
// AdminDashboardContent mounts useUsers() directly AND useUserStats(), which
// mounts useUsers(1, 1000) again. @supabase/supabase-js dedupes channels by
// topic, so both instances used to share the 'users-profiles-changes' channel;
// the second instance then attached callbacks to an already-subscribed
// channel, which recent @supabase/realtime-js versions reject with a throw.
//
// The fake client below mirrors those semantics so this test fails if the
// static channel names ever come back.

type FakeChannel = {
  topic: string;
  state: string;
  bindings: Array<{ type: string; filter: any; cb: () => void }>;
  on(type: string, filter: any, cb: () => void): FakeChannel;
  subscribe(): FakeChannel;
};

const channels = new Map<string, FakeChannel>();
const removedTopics: string[] = [];
// When true, removeChannel records the removal but leaves the channel
// registered, mirroring that the real client's removal is asynchronous.
let deferRemoval = false;

function makeChannel(topic: string): FakeChannel {
  const chan: FakeChannel = {
    topic,
    state: "closed",
    bindings: [],
    on(type: string, filter: any, cb: () => void) {
      if (chan.state !== "closed") {
        throw new Error(
          `cannot add \`${type}\` callbacks for ${chan.topic} after \`subscribe()\`.`
        );
      }
      chan.bindings.push({ type, filter, cb });
      return chan;
    },
    subscribe() {
      chan.state = "joining";
      return chan;
    },
  };
  return chan;
}

const mockInvalidate = mock(() => {});

mock.module("@/integrations/supabase/client", () => ({
  supabase: {
    channel: (topic: string) => {
      const existing = channels.get(topic);
      if (existing) return existing;
      const chan = makeChannel(topic);
      channels.set(topic, chan);
      return chan;
    },
    removeChannel: (chan: FakeChannel) => {
      removedTopics.push(chan.topic);
      if (!deferRemoval) channels.delete(chan.topic);
      return Promise.resolve("ok");
    },
  },
}));

mock.module("@/lib/logger", () => ({
  logger: { warn: () => {}, error: () => {}, info: () => {} },
}));

mock.module("@/contexts/AuthContext", () => ({}));

// Capture useEffect callbacks.
let effectCallbacks: Array<() => (() => void) | void> = [];

mock.module("react", () => ({
  useEffect: (cb: () => (() => void) | void) => {
    effectCallbacks.push(cb);
  },
}));

mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
  useQuery: () => ({ data: undefined, isLoading: false, error: null }),
}));

// Imported dynamically so the mocks above are registered before the hook's
// module graph (including the supabase client) is evaluated.
let useUsers: typeof import("../../../src/hooks/useUsers").useUsers;
let useUserStats: typeof import("../../../src/hooks/useUsers").useUserStats;

beforeAll(async () => {
  const mod = await import("../../../src/hooks/useUsers");
  useUsers = mod.useUsers;
  useUserStats = mod.useUserStats;
});

describe("useUsers realtime subscriptions", () => {
  beforeEach(() => {
    channels.clear();
    removedTopics.length = 0;
    effectCallbacks = [];
    deferRemoval = false;
    mockInvalidate.mockClear();
  });

  it("supports concurrent instances, as mounted by the admin dashboard", () => {
    // AdminDashboardContent calls useUsers() and useUserStats() (which calls
    // useUsers(1, 1000)); both effects run while the first instance's channels
    // are already subscribed.
    useUsers();
    useUserStats();
    expect(effectCallbacks.length).toBe(2);

    const cleanupA = effectCallbacks[0]() as () => void;
    // With static channel names this second effect threw because it aliased
    // the first instance's already-subscribed channel.
    const cleanupB = effectCallbacks[1]() as () => void;

    expect(channels.size).toBe(4);

    cleanupA();
    cleanupB();
    expect(removedTopics.length).toBe(4);
  });

  it("uses a unique realtime topic per hook instance", () => {
    useUsers();
    useUsers();
    effectCallbacks.forEach((cb) => cb());

    const topics = [...channels.keys()];
    expect(topics.length).toBe(4);
    expect(new Set(topics).size).toBe(topics.length);
    expect(topics.some((t) => t.startsWith("users-profiles-changes"))).toBe(true);
    expect(topics.some((t) => t.startsWith("users-roles-changes"))).toBe(true);
  });

  it("invalidates the users query when a postgres change arrives", () => {
    useUsers();
    effectCallbacks[0]();

    const profilesChannel = [...channels.values()].find((c) =>
      c.topic.startsWith("users-profiles-changes")
    );
    expect(profilesChannel).toBeDefined();
    const binding = profilesChannel!.bindings.find(
      (b) => b.type === "postgres_changes"
    );
    expect(binding).toBeDefined();

    binding!.cb();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("survives a remount while the previous removal is still pending", () => {
    // removeChannel() is asynchronous in the real client; a quick unmount +
    // remount used to re-request the old static topic and alias the channel
    // that was still tearing down.
    deferRemoval = true;
    useUsers();
    const cleanupA = effectCallbacks[0]() as () => void;
    cleanupA(); // removal recorded but channel still registered

    useUsers();
    expect(() => effectCallbacks[1]()).not.toThrow();
    expect(channels.size).toBe(4);
  });

  it("cleans up its own channels on unmount", () => {
    useUsers();
    const cleanup = effectCallbacks[0]() as () => void;
    const topics = [...channels.keys()];
    cleanup();
    expect(removedTopics).toEqual(topics);
    expect(channels.size).toBe(0);
  });
});
