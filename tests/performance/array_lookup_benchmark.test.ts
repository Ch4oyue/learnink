
import { describe, test, expect } from "bun:test";
import { performance } from "perf_hooks";

// Types mimicking the application
interface Module {
  id: string;
  title: string;
}

interface UserProgress {
  module_id: string;
  is_completed: boolean;
  progress_percent: number;
}

// Data Generators
function generateData(count: number) {
  const modules: Module[] = [];
  const userProgress: UserProgress[] = [];

  for (let i = 0; i < count; i++) {
    const id = `module-${i}`;
    modules.push({ id, title: `Module ${i}` });
    // Simulate 50% completion rate
    if (i % 2 === 0) {
      userProgress.push({
        module_id: id,
        is_completed: true,
        progress_percent: 100
      });
    }
  }
  return { modules, userProgress };
}

describe("Array.find vs Map Lookup Benchmark", () => {
  test("compares O(N*M) Array.find vs O(N) Map Creation + O(1) Lookup", () => {
    // Reduced for CI compliance (timeout < 5000ms)
    const SIZES = [100, 500];
    const ITERATIONS = 100;

    console.log("\n--- Starting Lookup Benchmark ---");

    for (const size of SIZES) {
      console.log(`\ndataset_size: ${size} items`);
      const { modules, userProgress } = generateData(size);

      // --- Baseline: Array.find ---
      const startBaseline = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        let completedCount = 0;
        // Simulate Calculation Logic
        const completedModules = modules.filter(m =>
            userProgress.some(p => p.module_id === m.id && p.is_completed)
        ).length;

        // Simulate Render Loop Logic
        for (const module of modules) {
             const progress = userProgress.find(p => p.module_id === module.id);
             if (progress) completedCount++;
        }
      }
      const endBaseline = performance.now();
      const timeBaseline = endBaseline - startBaseline;

      // --- Optimized: Map ---
      const startOptimized = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        let completedCount = 0;

        // 1. Create Map (Simulating useMemo overhead per render if dependencies changed,
        // OR just the cost of building it once per 'render' in this tight loop to be fair comparison of total work)
        // In reality, useMemo saves this step, making it even faster on re-renders.
        // We will include map creation time here to show that EVEN with creation, it is faster or comparable.
        const progressMap = new Map(userProgress.map(p => [p.module_id, p]));

        // Simulate Calculation Logic (Optimized)
        // We can just iterate the map or use the map for lookups.
        // Code usually iterates modules to filter.
        const completedModules = modules.filter(m => {
            const p = progressMap.get(m.id);
            return p?.is_completed;
        }).length;

        // Simulate Render Loop Logic (Optimized)
        for (const module of modules) {
             const progress = progressMap.get(module.id);
             if (progress) completedCount++;
        }
      }
      const endOptimized = performance.now();
      const timeOptimized = endOptimized - startOptimized;

      console.log(`Baseline (Array.find):   ${timeBaseline.toFixed(2)}ms`);
      console.log(`Optimized (Map):         ${timeOptimized.toFixed(2)}ms`);

      const improvement = ((timeBaseline - timeOptimized) / timeBaseline) * 100;
      console.log(`Improvement:             ${improvement.toFixed(2)}% faster`);
    }

    // Simple correctness check
    const { modules, userProgress } = generateData(10);
    const progressMap = new Map(userProgress.map(p => [p.module_id, p]));
    const found = progressMap.get(modules[0].id);
    expect(found).toBeDefined();
    expect(found?.module_id).toBe(modules[0].id);
  });
});
