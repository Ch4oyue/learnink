import { expect, test, describe } from "bun:test";

describe("Modules Progress Lookup Benchmark", () => {
  const MODULE_COUNT = 2000;
  const PROGRESS_COUNT = 2000;

  // Generate synthetic data
  const modules = Array.from({ length: MODULE_COUNT }, (_, i) => ({
    id: `module-${i}`,
    title: `Module ${i}`,
  }));

  const userProgress = Array.from({ length: PROGRESS_COUNT }, (_, i) => ({
    module_id: `module-${i}`,
    progress_percent: Math.floor(Math.random() * 100),
  }));

  test("Benchmark: Array.find (O(N^2)) vs Map Lookup (O(N))", () => {
    // --- Baseline: O(N^2) Approach ---
    const startBaseline = performance.now();

    let totalProgressBaseline = 0;
    for (const module of modules) {
      const progress = userProgress.find((p) => p.module_id === module.id);
      totalProgressBaseline += progress?.progress_percent || 0;
    }

    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    console.log(`\n--- Benchmark Results ---`);
    console.log(`Items: ${MODULE_COUNT} modules, ${PROGRESS_COUNT} progress records`);
    console.log(`Baseline (Array.find): ${baselineTime.toFixed(4)} ms`);

    // --- Optimized: Map Lookup Approach ---
    const startOptimized = performance.now();

    // Create Map (part of the cost)
    const progressMap = new Map();
    for (const p of userProgress) {
      progressMap.set(p.module_id, p.progress_percent);
    }

    let totalProgressOptimized = 0;
    for (const module of modules) {
      const progress = progressMap.get(module.id);
      totalProgressOptimized += progress || 0;
    }

    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Optimized (Map):       ${optimizedTime.toFixed(4)} ms`);
    console.log(`Improvement:           ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
    console.log(`-------------------------\n`);

    expect(totalProgressBaseline).toBe(totalProgressOptimized);
    // We expect significant improvement, usually > 10x for this size
    expect(optimizedTime).toBeLessThan(baselineTime);
  });
});
