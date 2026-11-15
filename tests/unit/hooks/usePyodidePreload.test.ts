/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

// --- Mocks Setup ---

// Mock pyodideManager
const mockLoad = mock(() => Promise.resolve());
mock.module("@/lib/pyodide-manager", () => ({
  pyodideManager: {
    load: mockLoad
  }
}));

// Mock React
// We need to capture the effect callback to run it
let effectCallback: (() => void) | undefined;
mock.module("react", () => ({
  useEffect: (cb: () => void, deps: any[]) => {
    effectCallback = cb;
  }
}));

// Mock usePerformance (mirror the real module's exports)
mock.module("@/hooks/usePerformance", () => ({
  isLowEndDevice: () => false,
  getPerformanceTier: () => "high",
}));

import { usePyodidePreload } from "../../../src/hooks/usePyodidePreload";

describe("usePyodidePreload", () => {
  let originalSetTimeout: any;
  let originalClearTimeout: any;

  beforeEach(() => {
    mockLoad.mockClear();
    effectCallback = undefined;

    // Mock global window and requestIdleCallback
    global.window = {
        requestIdleCallback: (cb: any) => cb()
    } as any;

    // Mock setTimeout to execute immediately
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
    global.setTimeout = ((cb: () => void) => {
        cb();
        return 123;
    }) as any;
    global.clearTimeout = (() => {}) as any;
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it("should preload pyodide when python code block is present", () => {
    const content = "Some text\n```python\nprint('hi')\n```";

    usePyodidePreload(content);

    // Manually trigger the effect
    if (effectCallback) effectCallback();

    expect(mockLoad).toHaveBeenCalled();
  });

  it("should NOT preload when no python code block", () => {
    const content = "Just some markdown";

    usePyodidePreload(content);

    // Manually trigger the effect
    if (effectCallback) effectCallback();

    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("should handle undefined content gracefully", () => {
    usePyodidePreload(undefined);

    if (effectCallback) effectCallback();

    expect(mockLoad).not.toHaveBeenCalled();
  });
});
