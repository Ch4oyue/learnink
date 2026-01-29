import { describe, test } from "bun:test";

interface UserProgress {
  progress_percent: number | null;
  is_completed: boolean | null;
}

// Generate dataset
const generateProgress = (count: number): UserProgress[] => {
  return Array.from({ length: count }, () => ({
    progress_percent: Math.floor(Math.random() * 100),
    is_completed: Math.random() > 0.5,
  }));
};

describe("Progress Stats Calculation Benchmark", () => {
  // Reduced for CI - still demonstrates O(N) vs O(1) difference
  test("compares Recalculation vs Memoized Access", () => {
    const DATASET_SIZES = [100, 500, 2000]; // Reduced from [100, 1000, 10000]
    const ITERATIONS = 5000; // Reduced from 10000

    console.log("\n--- Starting Progress Stats Benchmark ---");

    for (const size of DATASET_SIZES) {
      console.log(`\nDataset Size: ${size} items`);
      const progress = generateProgress(size);

      // --- Baseline: Fresh Calculation ---
      const startBaseline = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        const totalModules = progress?.length || 0;
        const completedModules = progress?.filter(p => p.is_completed).length || 0;
        const averageProgress = totalModules > 0
          ? Math.round(progress!.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / totalModules)
          : 0;
      }
      const endBaseline = performance.now();
      const timeBaseline = endBaseline - startBaseline;

      // --- Optimized: Cached Result ---
      // Simulating accessing a memoized object
      const cachedStats = {
        totalModules: progress.length,
        completedModules: progress.filter(p => p.is_completed).length,
        averageProgress: Math.round(progress.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / progress.length)
      };

      const startOptimized = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        const stats = cachedStats;
      }
      const endOptimized = performance.now();
      const timeOptimized = endOptimized - startOptimized;

      console.log(`Baseline (Recalc):       ${timeBaseline.toFixed(4)}ms`);
      console.log(`Optimized (Cached):      ${timeOptimized.toFixed(4)}ms`);

      const safeOptimized = timeOptimized === 0 ? 0.001 : timeOptimized;
      const improvement = timeBaseline / safeOptimized;

      console.log(`Improvement Factor:      ${improvement.toFixed(1)}x faster`);
      console.log(`Cost per render (avg):   ${(timeBaseline / ITERATIONS).toFixed(4)}ms`);
    }
  });
});
