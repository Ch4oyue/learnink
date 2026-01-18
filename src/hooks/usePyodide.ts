import { useState, useRef, useCallback } from "react";
import { pyodideManager } from "@/lib/pyodide-manager";

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
  
  const pyodideRef = useRef<any>(null);
  const outputBuffer = useRef<string[]>([]);

  const setupStreams = useCallback((pyodide: any) => {
    pyodide.setStdout({
      batched: (text: string) => {
        outputBuffer.current.push(text);
      },
    });

    pyodide.setStderr({
      batched: (text: string) => {
        outputBuffer.current.push(`[Error] ${text}`);
      },
    });
  }, []);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || state.isLoading) return;
    
    setState({ isLoading: true, isReady: false, error: null });
    
    try {
      const pyodide = await pyodideManager.load();
      
      pyodideRef.current = pyodide;
      
      setState({ isLoading: false, isReady: true, error: null });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load Python runtime";
      setState({ isLoading: false, isReady: false, error: errorMsg });
      onError?.(errorMsg);
    }
  }, [state.isLoading, onError, setupStreams]);

  const runCode = useCallback(async (code: string): Promise<{ output: string; error?: string }> => {
    if (!pyodideRef.current) {
      await loadPyodide();
    }
    
    if (!pyodideRef.current) {
      return { output: "", error: "Python runtime not loaded" };
    }
    
    // Ensure streams are directed to this hook's buffer
    setupStreams(pyodideRef.current);

    outputBuffer.current = [];
    
    try {
      // Note: Previous implementation defined `wrappedCode` but didn't use it.
      // We maintain the existing behavior of running `code` directly.
      // Output is captured via setStdout (setupStreams).
      
      const result = await pyodideRef.current.runPythonAsync(code);
      const bufferedOutput = outputBuffer.current.join('\n');
      
      // Combine buffered output with result
      let output = bufferedOutput;
      if (result !== undefined && result !== null && result.toString() !== 'None') {
        output += (output ? '\n' : '') + String(result);
      }
      
      onOutput?.(output);
      return { output };
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      onError?.(errorMsg);
      return { output: outputBuffer.current.join('\n'), error: errorMsg };
    }
  }, [loadPyodide, onOutput, onError, setupStreams]);

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
