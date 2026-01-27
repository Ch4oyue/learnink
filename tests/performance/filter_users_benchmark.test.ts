
import { describe, test, expect } from "bun:test";
import { performance } from "perf_hooks";

// Mock User Interface based on src/hooks/useUsers.ts
interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: 'user' | 'tutor' | 'admin' | 'superadmin';
}

// Data Generator
function generateUsers(count: number): UserWithRole[] {
  const users: UserWithRole[] = [];
  const roles = ['user', 'tutor', 'admin', 'superadmin'] as const;

  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-uuid-${i}-${Math.random().toString(36).substring(7)}`,
      email: `user${i}@example.com`,
      display_name: `User Name ${i}`,
      avatar_url: null,
      created_at: new Date().toISOString(),
      role: roles[i % 4],
    });
  }
  return users;
}

describe("AdminDashboard Filter Performance", () => {
  test("compares Unoptimized vs Hoisted Filtering", () => {
    const DATASET_SIZE = 5000; // Realistic upper bound for client-side filtering
    const ITERATIONS = 1000;
    const searchQuery = "Name 50"; // Search query that matches some users

    console.log(`\n--- Starting Filter Benchmark (N=${DATASET_SIZE}, Iterations=${ITERATIONS}) ---`);

    const users = generateUsers(DATASET_SIZE);

    // --- Baseline: Current Implementation ---
    // Problem: .toLowerCase() is called 2 * N times per filter
    const startBaseline = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const filtered = users.filter(u =>
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const endBaseline = performance.now();
    const timeBaseline = endBaseline - startBaseline;

    // --- Optimized: Hoisted .toLowerCase() ---
    // Improvement: .toLowerCase() called once for query, and ideally users are normalized (but we just hoist query here as minimal change)
    const startOptimized = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = users.filter(u =>
        u.display_name?.toLowerCase().includes(lowerQuery) ||
        u.id.toLowerCase().includes(lowerQuery)
      );
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log(`Baseline (Inside Loop):    ${timeBaseline.toFixed(2)}ms`);
    console.log(`Optimized (Hoisted):       ${timeOptimized.toFixed(2)}ms`);

    const improvement = ((timeBaseline - timeOptimized) / timeBaseline) * 100;
    console.log(`Algorithmic Improvement:   ${improvement.toFixed(2)}% faster (excluding useMemo gains)`);

    // Functional Correctness Check
    const lowerQuery = searchQuery.toLowerCase();
    const baselineResult = users.filter(u =>
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const optimizedResult = users.filter(u =>
        u.display_name?.toLowerCase().includes(lowerQuery) ||
        u.id.toLowerCase().includes(lowerQuery)
    );

    expect(baselineResult.length).toBe(optimizedResult.length);
    expect(baselineResult[0]?.id).toBe(optimizedResult[0]?.id);
  });
});
