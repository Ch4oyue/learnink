/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, mock, beforeEach } from "bun:test";

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

import { usePyodidePreload } from "../../../src/hooks/usePyodidePreload";

describe("usePyodidePreload", () => {
  beforeEach(() => {
    mockLoad.mockClear();
    effectCallback = undefined;

    // Mock global window and requestIdleCallback
    global.window = {
        requestIdleCallback: (cb: any) => cb()
    } as any;
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
