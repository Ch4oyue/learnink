import { expect, test, mock, describe, beforeEach, afterEach } from "bun:test";
import { PyodideInstance } from "../src/lib/pyodide-manager";

// Mocking globals for PyodideManager
const mockLoadPyodide = mock(async (_config: unknown) => {
    return {
        runPythonAsync: async (code: string) => `Executed: ${code}`,
        setStdout: () => {},
        setStderr: () => {},
    } as unknown as PyodideInstance;
});

const mockAppendChild = mock((script: unknown) => {
    const s = script as { onload?: () => void };
    // Simulate script loading immediately
    setTimeout(() => {
        if (s.onload) s.onload();
    }, 0);
});

const mockCreateElement = mock((_tag: string) => {
    return {
        src: "",
        async: false,
        onload: null,
        onerror: null,
    } as unknown;
});

// Setup globals
global.window = {
    loadPyodide: undefined, // Initially undefined
    pyodide: undefined,
} as unknown as Window & typeof globalThis;

global.document = {
    createElement: mockCreateElement,
    head: {
        appendChild: mockAppendChild,
    },
} as unknown as Document;

// Import the manager AFTER setting up globals if possible,
// but since we are in ESM, imports happen first.
// However, the manager implementation accesses window inside methods, not at top level (except for checking window existence maybe?)
// Let's check pyodide-manager.ts content again.
// It accesses window in `initializePyodide`.
// So we are safe to import it now.

import { pyodideManager } from "../src/lib/pyodide-manager";

describe("PyodideManager Singleton Optimization", () => {

    beforeEach(() => {
        // Reset mocks
        mockLoadPyodide.mockClear();
        mockAppendChild.mockClear();
        mockCreateElement.mockClear();

        // Reset window state
        // Note: pyodideManager is a singleton instance created at module level.
        // We cannot easily reset its internal state (private pyodidePromise).
        // This is a limitation of testing singletons.
        // However, we can test that subsequent calls return the SAME promise.

        // Setup window.loadPyodide so it works when script is "loaded"
        // But wait, the manager logic is:
        // if (!window.loadPyodide) -> loadScript
        // then if (!window.loadPyodide) -> throw

        // So inside mockAppendChild (simulating script load), we should set window.loadPyodide

        // Updating mockAppendChild behavior for this test run
        // We can't change the const mock, but we can change global behavior if needed.
        // But here the logic is hardcoded in the mock above.
        // Let's adjust the mock behavior via a side effect.
    });

    test("should load Pyodide only once when called multiple times", async () => {
        // We need to simulate the script setting window.loadPyodide when loaded.
        global.document.head.appendChild = (script: unknown) => {
             const s = script as { onload?: () => void };
             setTimeout(() => {
                 // Simulate script execution defining loadPyodide
                 (global.window as unknown as { loadPyodide: typeof mockLoadPyodide }).loadPyodide = mockLoadPyodide;
                 if (s.onload) s.onload();
             }, 10);
             return script as Node;
        };

        // If pyodideManager was already used in other tests (unlikely here as it's the only test), it might be initialized.
        // Since we can't reset the private state of the singleton, we just verify calls.
        // BUT, if this test runs, pyodideManager might have been initialized if imported before?
        // No, it's lazy loaded via `load()`.

        // Start two loads concurrently
        const p1 = pyodideManager.load();
        const p2 = pyodideManager.load();

        // Wait for them
        const [inst1, inst2] = await Promise.all([p1, p2]);

        expect(inst1).toBe(inst2);

        // Verify loadPyodide was called exactly once
        expect(mockLoadPyodide).toHaveBeenCalledTimes(1);
    });
});
