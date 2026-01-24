
// Pyodide Worker
// Handles Python execution in a separate thread

// Types for worker messages
type WorkerMessage =
  | { type: 'INIT'; config: { indexURL: string; scriptURL: string } }
  | { type: 'RUN'; id: string; code: string };

type WorkerResponse =
  | { type: 'READY' }
  | { type: 'ERROR'; error: string }
  | { type: 'STDOUT'; text: string } // We don't need ID for stdout as we assume single active execution context for now or stream to global handler
  | { type: 'STDERR'; text: string }
  | { type: 'RESULTS'; id: string; results: unknown; error?: string };

// Global context for the worker
declare const self: DedicatedWorkerGlobalScope;
// Declare loadPyodide which comes from the imported script
let pyodide: any = null;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  try {
    if (type === 'INIT') {
      const { config } = event.data;

      // Load the Pyodide script
      // Using dynamic import for Module Worker compatibility
      const { loadPyodide } = await import(config.scriptURL);

      // Initialize Pyodide
      pyodide = await loadPyodide({
        indexURL: config.indexURL,
      });

      // Set up standard streams
      pyodide.setStdout({
        batched: (text: string) => {
          self.postMessage({ type: 'STDOUT', text });
        },
      });

      pyodide.setStderr({
        batched: (text: string) => {
          self.postMessage({ type: 'STDERR', text });
        },
      });

      self.postMessage({ type: 'READY' });
    } else if (type === 'RUN') {
      const { id, code } = event.data;

      if (!pyodide) {
        throw new Error("Pyodide not initialized");
      }

      // Load packages automatically if needed (optional optimization)
      await pyodide.loadPackagesFromImports(code);

      // Run code
      const results = await pyodide.runPythonAsync(code);

      self.postMessage({
        type: 'RESULTS',
        id,
        results: results !== undefined ? results : null
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (type === 'RUN') {
      // @ts-ignore
      self.postMessage({ type: 'RESULTS', id: event.data.id, error: errorMessage });
    } else {
      self.postMessage({ type: 'ERROR', error: errorMessage });
    }
  }
};
