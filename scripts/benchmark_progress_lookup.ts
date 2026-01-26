
import { performance } from "perf_hooks";

const NUM_MODULES = 1000;
const LOOKUPS = 10000;

interface UserProgress {
  module_id: string;
  progress_percent: number;
  is_completed: boolean;
}

// Generate data
const modules = Array.from({ length: NUM_MODULES }, (_, i) => ({
  id: `module-${i}`,
}));

const progressData: UserProgress[] = modules.map((m) => ({
  module_id: m.id,
  progress_percent: Math.floor(Math.random() * 100),
  is_completed: Math.random() > 0.5,
}));

console.log(`Benchmarking with ${NUM_MODULES} items and ${LOOKUPS} lookups...`);

// Method 1: Array.find
const startFind = performance.now();
for (let i = 0; i < LOOKUPS; i++) {
  const targetId = `module-${Math.floor(Math.random() * NUM_MODULES)}`;
  const p = progressData.find((p) => p.module_id === targetId);
}
const endFind = performance.now();
const timeFind = endFind - startFind;

// Method 2: Map.get
const startMapBuild = performance.now();
const progressMap = new Map(progressData.map((p) => [p.module_id, p]));
const endMapBuild = performance.now();

const startMapGet = performance.now();
for (let i = 0; i < LOOKUPS; i++) {
  const targetId = `module-${Math.floor(Math.random() * NUM_MODULES)}`;
  const p = progressMap.get(targetId);
}
const endMapGet = performance.now();
const timeMapTotal = (endMapGet - startMapGet) + (endMapBuild - startMapBuild);

console.log(`\nResults:`);
console.log(`Array.find: ${timeFind.toFixed(2)}ms`);
console.log(`Map (Build + Get): ${timeMapTotal.toFixed(2)}ms`);
console.log(`Map Build Time: ${(endMapBuild - startMapBuild).toFixed(2)}ms`);
console.log(`Map Lookup Only: ${(endMapGet - startMapGet).toFixed(2)}ms`);
console.log(`\nImprovement: ${((timeFind - timeMapTotal) / timeFind * 100).toFixed(2)}% faster`);
