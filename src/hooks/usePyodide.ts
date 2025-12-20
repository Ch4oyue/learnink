import { useState, useRef, useCallback, useEffect } from "react";

interface UsePyodideOptions {
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
}

interface PyodideState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    pyodide: any;
  }
}

export function usePyodide({ onOutput, onError }: UsePyodideOptions = {}) {
  const [state, setState] = useState<PyodideState>({
    isLoading: false,
    isReady: false,
    error: null,
  });
  
  const pyodideRef = useRef<any>(null);
  const outputBuffer = useRef<string[]>([]);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || state.isLoading) return;
    
    setState({ isLoading: true, isReady: false, error: null });
    
    try {
      // Load Pyodide script if not already loaded
      if (!window.loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
          document.head.appendChild(script);
        });
      }
      
      // Initialize Pyodide
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
      });
      
      // Set up stdout/stderr capture
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
      
      pyodideRef.current = pyodide;
      window.pyodide = pyodide;
      
      setState({ isLoading: false, isReady: true, error: null });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load Python runtime";
      setState({ isLoading: false, isReady: false, error: errorMsg });
      onError?.(errorMsg);
    }
  }, [state.isLoading, onError]);

  const runCode = useCallback(async (code: string): Promise<{ output: string; error?: string }> => {
    if (!pyodideRef.current) {
      await loadPyodide();
    }
    
    if (!pyodideRef.current) {
      return { output: "", error: "Python runtime not loaded" };
    }
    
    outputBuffer.current = [];
    
    try {
      // Wrap code to capture print output
      const wrappedCode = `
import sys
from io import StringIO

_output = StringIO()
_old_stdout = sys.stdout
sys.stdout = _output

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
finally:
    sys.stdout = _old_stdout
    
_output.getvalue()
`;
      
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
  }, [loadPyodide, onOutput, onError]);

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
