import { appendFile } from "node:fs/promises";

// Configuration
const ITERATIONS = 1000;
const NETWORK_LATENCY_MEAN = 100; // ms
const NETWORK_LATENCY_JITTER = 40; // +/- ms
const DB_QUERY_TIME = 2; // ms per query - Postgres is fast!

// Helper to simulate network request
// Returns a promise that resolves after (Latency + Processing) ms
const simulateRequest = async (queryCost = 1) => {
  // Random latency between MEAN - JITTER and MEAN + JITTER
  const latency = NETWORK_LATENCY_MEAN + (Math.random() * 2 - 1) * NETWORK_LATENCY_JITTER;
  const processing = DB_QUERY_TIME * queryCost;
  const totalDuration = Math.max(5, latency + processing);

  await new Promise(resolve => setTimeout(resolve, totalDuration));
  return { data: "simulated_data" };
};

async function benchmarkOld() {
    const start = performance.now();
    // The old method used Promise.all for 4 parallel requests
    // user_progress, user_quiz_attempts, learning_notes (count), learning_notes (week)
    await Promise.all([
        simulateRequest(1),
        simulateRequest(1),
        simulateRequest(1),
        simulateRequest(1)
    ]);
    return performance.now() - start;
}

async function benchmarkNew() {
    const start = performance.now();
    // The new method uses 1 RPC call
    // The query is slightly more complex (CTEs), so we estimate 2x DB processing time of a simple select,
    // but only 1 network round trip.
    await simulateRequest(2.0);
    return performance.now() - start;
}

async function run() {
    console.log(`Running benchmark with ${ITERATIONS} iterations...`);
    console.log(`Simulating Network: ${NETWORK_LATENCY_MEAN}ms ±${NETWORK_LATENCY_JITTER}ms`);

    const oldTimes: number[] = [];
    const newTimes: number[] = [];

    // Warmup
    await benchmarkOld();
    await benchmarkNew();

    for (let i = 0; i < ITERATIONS; i++) {
        oldTimes.push(await benchmarkOld());
        newTimes.push(await benchmarkNew());
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const p95 = (arr: number[]) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * 0.95)];
    };
    const min = (arr: number[]) => Math.min(...arr);
    const max = (arr: number[]) => Math.max(...arr);

    const oldAvg = avg(oldTimes);
    const newAvg = avg(newTimes);

    const results = `
Benchmark Results (Simulated):
==================================================
Old Method (Client-Side Aggregation - 4 reqs):
  Average: ${oldAvg.toFixed(2)}ms
  p95:     ${p95(oldTimes).toFixed(2)}ms
  Range:   ${min(oldTimes).toFixed(0)} - ${max(oldTimes).toFixed(0)}ms

New Method (Server-Side RPC - 1 req):
  Average: ${newAvg.toFixed(2)}ms
  p95:     ${p95(newTimes).toFixed(2)}ms
  Range:   ${min(newTimes).toFixed(0)} - ${max(newTimes).toFixed(0)}ms

--------------------------------------------------
IMPROVEMENT:
  Speedup: ${(oldAvg / newAvg).toFixed(2)}x faster
  Latency Reduction: -${(oldAvg - newAvg).toFixed(2)}ms (-${(100 * (1 - newAvg/oldAvg)).toFixed(1)}%)
==================================================
`;
    console.log(results);
}

run().catch(console.error);
