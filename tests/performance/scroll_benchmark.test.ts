
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, mock } from "bun:test";

// --- Mocks Setup ---

// Mock Element methods
const mockGetBoundingClientRect = mock(() => ({
  top: 100,
  height: 1000,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0
}));

const mockElement = {
  getBoundingClientRect: mockGetBoundingClientRect,
  scrollHeight: 2000,
};

const contentRef = { current: mockElement };

// Mock Document
global.document = {
  documentElement: {
    scrollTop: 0
  }
} as any;

// Mock Window
global.window = {
  innerHeight: 800,
  scrollY: 0,
  addEventListener: mock(),
  removeEventListener: mock(),
} as any;

// Mock requestAnimationFrame
let rafQueue: FrameRequestCallback[] = [];
global.requestAnimationFrame = (cb) => {
  rafQueue.push(cb);
  return 123; // Dummy ID
};
global.cancelAnimationFrame = mock();

// Mock React Hooks
mock.module("react", () => ({
  useCallback: (fn: any) => fn,
  useRef: (val: any) => ({ current: val }),
  useEffect: (fn: any) => {
    const cleanup = fn();
    return cleanup;
  },
  useState: (val: any) => [val, mock()],
}));

import { useScrollProgress } from "../../src/hooks/useScrollProgress";

describe("useScrollProgress Performance Benchmark", () => {
  test("measures Layout Thrashing (getBoundingClientRect calls)", () => {
    // Reset counters and queue
    mockGetBoundingClientRect.mockClear();
    (window.addEventListener as any).mockClear();
    rafQueue = [];

    console.log("\n--- Starting Benchmark (Optimized) ---");

    // Initialize Hook
    useScrollProgress({
      contentRef: contentRef as any,
      onProgressChange: () => {}
    });

    // Verify initial metric update happened on mount
    // Expect 1 call from useEffect -> updateMetrics
    expect(mockGetBoundingClientRect).toHaveBeenCalled();
    const initialCalls = mockGetBoundingClientRect.mock.calls.length;
    console.log(`Initial Setup Calls: ${initialCalls}`);

    // Reset for the scroll loop
    mockGetBoundingClientRect.mockClear();

    const addListenerMock = window.addEventListener as any;
    const handleScroll = addListenerMock.mock.calls[0][1];

    // --- BENCHMARK EXECUTION ---
    const ITERATIONS = 1000;

    const initialMemory = process.memoryUsage().heapUsed;
    console.log(`Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);

    const start = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      handleScroll();

      // Simulate RAF firing
      if (rafQueue.length > 0) {
        const cb = rafQueue.shift();
        if (cb) cb(performance.now());
      }
    }

    const end = performance.now();

    const finalMemory = process.memoryUsage().heapUsed;
    console.log(`Final Memory:   ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    const delta = finalMemory - initialMemory;
    console.log(`Memory Delta:   ${(delta / 1024 / 1024).toFixed(2)} MB`);
    const duration = end - start;
    const callCount = mockGetBoundingClientRect.mock.calls.length;

    console.log(`Simulated Scroll Events: ${ITERATIONS}`);
    console.log(`Total Execution Time:    ${duration.toFixed(2)}ms`);
    console.log(`getBoundingClientRect:   ${callCount} calls`);

    // EXPECTATIONS FOR OPTIMIZED CODE
    // Should be 0 because we use cached metrics
    expect(callCount).toBe(0);
  });
});
