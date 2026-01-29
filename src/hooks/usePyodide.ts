import { useState, useRef, useCallback, useEffect } from "react";
import { pyodideManager, PyodideInstance } from "@/lib/pyodide-manager";

interface UsePyodideOptions {
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
}

interface PyodideState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

export function usePyodide({ onOutput, onError }: UsePyodideOptions = {}) {
  const [state, setState] = useState<PyodideState>({
    isLoading: false,
    isReady: false,
    error: null,
  });

  const pyodideRef = useRef<PyodideInstance | null>(null);
  const outputBuffer = useRef<string[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Use refs for callbacks to avoid re-creating functions when callbacks change
  const onOutputRef = useRef(onOutput);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onOutputRef.current = onOutput;
  }, [onOutput]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanupSubscriptions = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const subscribeStreams = useCallback((pyodide: PyodideInstance) => {
    cleanupSubscriptions();

    const unsubStdout = pyodide.setStdout((text) => {
      outputBuffer.current.push(text);
    });

    const unsubStderr = pyodide.setStderr((text) => {
      outputBuffer.current.push(`[Error] ${text}`);
    });

    unsubscribeRef.current = () => {
      unsubStdout();
      unsubStderr();
    };
  }, [cleanupSubscriptions]);

  // Ensure subscriptions are cleaned up on unmount
  useEffect(() => {
    return () => cleanupSubscriptions();
  }, [cleanupSubscriptions]);

  // Subscribe when ready
  useEffect(() => {
    if (state.isReady && pyodideRef.current) {
      subscribeStreams(pyodideRef.current);
    }
  }, [state.isReady, subscribeStreams]);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || state.isLoading) return;

    setState({ isLoading: true, isReady: false, error: null });

    try {
      const pyodide = await pyodideManager.load();

      pyodideRef.current = pyodide;

      setState({ isLoading: false, isReady: true, error: null });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load Python runtime";
      setState({ isLoading: false, isReady: false, error: errorMsg });
      onErrorRef.current?.(errorMsg);
    }
  }, [state.isLoading]);

  const runCode = useCallback(async (code: string): Promise<{ output: string; error?: string }> => {
    if (!pyodideRef.current) {
      await loadPyodide();
    }

    if (!pyodideRef.current) {
      return { output: "", error: "Python runtime not loaded" };
    }

    // Ensure we are subscribed (in case of fresh load before effect runs)
    if (!unsubscribeRef.current) {
      subscribeStreams(pyodideRef.current);
    }

    outputBuffer.current = [];

    try {
      // Note: Previous implementation defined `wrappedCode` but didn't use it.
      // We maintain the existing behavior of running `code` directly.
      // Output is captured via setStdout (subscribeStreams).

      const result = await pyodideRef.current.runPythonAsync(code);
      const bufferedOutput = outputBuffer.current.join('\n');

      // Combine buffered output with result
      let output = bufferedOutput;
      if (result !== undefined && result !== null && result.toString() !== 'None') {
        output += (output ? '\n' : '') + String(result);
      }

      onOutputRef.current?.(output);
      return { output };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onErrorRef.current?.(errorMsg);
      return { output: outputBuffer.current.join('\n'), error: errorMsg };
    }
  }, [loadPyodide, subscribeStreams]);

  const reset = useCallback(() => {
    outputBuffer.current = [];
  }, []);

  return {
    ...state,
    loadPyodide,
    runCode,
    reset,
  };
}
