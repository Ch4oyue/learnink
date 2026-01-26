import { describe, test } from "bun:test";
import { performance } from "perf_hooks";
import { filterUsers, filterUsersLegacy } from "../../src/lib/userUtils";
import { UserWithRole } from "../../src/hooks/useUsers";

function generateUsers(count: number): UserWithRole[] {
  const users: UserWithRole[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-id-${i}-${Math.random().toString(36).substring(7)}`,
      email: `user${i}@example.com`,
      display_name: i % 3 === 0 ? `User Name ${i}` : i % 3 === 1 ? null : `Another Name ${i}`,
      avatar_url: null,
      created_at: new Date().toISOString(),
      role: 'user'
    });
  }
  return users;
}

describe("User Filtering Benchmark", () => {
  const SIZES = [5000, 10000, 20000];
  const QUERY = "Name"; // A common query that will match many

  for (const size of SIZES) {
    test(`Benchmark with ${size} users`, () => {
        const users = generateUsers(size);
        const ITERATIONS = 500; // 500 iterations to be safe with timeout

        // Warmup
        filterUsersLegacy(users, QUERY);
        filterUsers(users, QUERY);

        const startLegacy = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            filterUsersLegacy(users, QUERY);
        }
        const endLegacy = performance.now();
        const timeLegacy = endLegacy - startLegacy;

        const startOptimized = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            filterUsers(users, QUERY);
        }
        const endOptimized = performance.now();
        const timeOptimized = endOptimized - startOptimized;

        console.log(`\n--- Dataset Size: ${size} ---`);
        console.log(`Legacy (Inline toLowerCase): ${timeLegacy.toFixed(2)}ms`);
        console.log(`Optimized (Hoisted):       ${timeOptimized.toFixed(2)}ms`);
        console.log(`Improvement:               ${((timeLegacy - timeOptimized) / timeLegacy * 100).toFixed(2)}%`);

        // Calculate estimated savings per render
        const legacyPerCall = timeLegacy / ITERATIONS;
        const optimizedPerCall = timeOptimized / ITERATIONS;
        console.log(`Time per render (Legacy):    ${legacyPerCall.toFixed(3)}ms`);
        console.log(`Time per render (Optimized): ${optimizedPerCall.toFixed(3)}ms`);
    });
  }
});
