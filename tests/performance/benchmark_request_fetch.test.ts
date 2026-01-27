
import { describe, test, expect } from "bun:test";
import { performance } from "perf_hooks";

// Define type for mock request to avoid any
interface MockRequest {
  id: string;
  user_id: string;
  topic: string;
  description: string;
  status: string;
  assigned_to: null;
  admin_notes: null;
  created_at: string;
  updated_at: string;
  category: string;
  priority: string;
  ai_summary: null;
  type: string;
  image_url: null;
}

// Mock data generator
const createMockRequest = (id: string): MockRequest => ({
  id,
  user_id: `user-${id}`,
  topic: `Topic ${id}`,
  description: `Description for request ${id} with some long text to simulate payload size.`.repeat(5),
  status: 'pending',
  assigned_to: null,
  admin_notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: 'General',
  priority: 'medium',
  ai_summary: null,
  type: 'module',
  image_url: null,
});

describe("Material Request Fetch Strategy Benchmark", () => {
  test("compares Fetch All (Filter) vs Fetch Single (Direct) payload and processing", () => {
    console.log("\n--- Starting Request Fetch Benchmark ---");

    // Setup Data
    const TARGET_ID = 'target-50';
    const dataSetSize = 100;
    const allRequests = Array.from({ length: dataSetSize }, (_, i) => createMockRequest(i === 50 ? TARGET_ID : `req-${i}`));
    const singleRequest = createMockRequest(TARGET_ID);

    // --- Baseline: Fetch All & Find ---
    const startBaseline = performance.now();

    // 1. Simulate Network Payload (Serialization cost + Size)
    const baselinePayload = JSON.stringify(allRequests);
    const baselineSize = Buffer.byteLength(baselinePayload, 'utf8');

    // 2. Simulate Client-side Processing (Parsing + Find)
    const parsedAll = JSON.parse(baselinePayload);
    const foundItem = parsedAll.find((r: MockRequest) => r.id === TARGET_ID);

    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // --- Optimization: Fetch Single ---
    const startOpt = performance.now();

    // 1. Simulate Network Payload
    const optPayload = JSON.stringify(singleRequest);
    const optSize = Buffer.byteLength(optPayload, 'utf8');

    // 2. Simulate Client-side Processing
    const parsedSingle = JSON.parse(optPayload); // Direct object

    const endOpt = performance.now();
    const optTime = endOpt - startOpt;

    // --- Results ---
    console.log(`[Baseline] Fetch All (${dataSetSize} items):`);
    console.log(`  - Payload Size: ${(baselineSize / 1024).toFixed(2)} KB`);
    console.log(`  - Process Time: ${baselineTime.toFixed(4)} ms`);

    console.log(`[Optimized] Fetch Single:`);
    console.log(`  - Payload Size: ${(optSize / 1024).toFixed(2)} KB`);
    console.log(`  - Process Time: ${optTime.toFixed(4)} ms`);

    const reduction = ((baselineSize - optSize) / baselineSize * 100);
    console.log(`Data Reduction: ${reduction.toFixed(2)}%`);

    // Assertions
    expect(foundItem).toBeDefined();
    expect(parsedSingle.id).toBe(TARGET_ID);
    expect(optSize).toBeLessThan(baselineSize / 50); // Expect huge reduction
    expect(optTime).toBeLessThan(baselineTime); // Expect it to be faster
  });
});
