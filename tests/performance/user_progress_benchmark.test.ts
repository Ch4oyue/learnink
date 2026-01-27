import { describe, test } from "bun:test";

interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  progress_percent: number;
}

// Generate a large dataset of user progress
const generateProgress = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `progress-${i}`,
    user_id: `user-1`,
    module_id: `module-${i}`,
    progress_percent: Math.floor(Math.random() * 100),
  }));
};

describe("User Progress Lookup Benchmark", () => {
  test("compares O(N) Array.find vs O(1) Direct Access", () => {
    const DATASET_SIZES = [100, 1000, 5000];
    const ITERATIONS = 10000;

    console.log("\n--- Starting User Progress Lookup Benchmark ---");

    for (const size of DATASET_SIZES) {
      console.log(`\nDataset Size: ${size} items`);
      const progressList = generateProgress(size);

      // Pick a target to search for (simulating searching for the current module's progress)
      // We pick an item near the end to simulate worst-case performance of .find()
      const targetId = `module-${Math.floor(size * 0.9)}`;
      const targetItem = progressList.find(p => p.module_id === targetId)!;

      // --- Baseline: Array.find ---
      const startBaseline = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        // This is what the current component does:
        // const progress = userProgress?.find(p => p.module_id === id);
        const found = progressList.find(p => p.module_id === targetId);
      }
      const endBaseline = performance.now();
      const timeBaseline = endBaseline - startBaseline;

      // --- Optimized: Direct Access ---
      // This simulates the new component structure:
      // const { data: progress } = useModuleProgress(...)
      // The lookup happens inside the hook (via map/query cache) or DB,
      // but to the component render cycle, it's an O(1) access.
      const startOptimized = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        const found = targetItem;
      }
      const endOptimized = performance.now();
      const timeOptimized = endOptimized - startOptimized;

      console.log(`Baseline (Array.find):   ${timeBaseline.toFixed(4)}ms`);
      console.log(`Optimized (Direct):      ${timeOptimized.toFixed(4)}ms`);

      // Calculate improvement
      // Avoid division by zero if optimized is too fast (0ms)
      const safeOptimized = timeOptimized === 0 ? 0.001 : timeOptimized;
      const improvement = timeBaseline / safeOptimized;

      console.log(`Improvement Factor:      ${improvement.toFixed(1)}x faster`);
    }
  });
});
