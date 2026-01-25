// Refactored Pyodide Manager using Web Worker
// Ensures Pyodide runs off the main thread to prevent UI blocking

interface PyodideConfig {
  indexURL: string;
}

// Pyodide instance type definition (Proxy to Worker)
export interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
}

const PYODIDE_VERSION = "v0.26.1";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const SCRIPT_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.mjs`;

class PyodideManager {
  private static instance: PyodideManager;
  private worker: Worker | null = null;
  private workerReadyPromise: Promise<void> | null = null;
  private pendingRuns = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

  // Callbacks for stdout/stderr
  private onStdout: ((text: string) => void) | null = null;
  private onStderr: ((text: string) => void) | null = null;

  private constructor() { }

  public static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager();
    }
    return PyodideManager.instance;
  }

  public async load(): Promise<PyodideInstance> {
    if (!this.worker) {
      this.initWorker();
    }

    await this.workerReadyPromise;

    // Return a proxy object that looks like the original PyodideInstance
    return {
      runPythonAsync: (code: string) => this.runPythonAsync(code),
      setStdout: (options) => {
        this.onStdout = options.batched;
      },
      setStderr: (options) => {
        this.onStderr = options.batched;
      }
    };
  }

  private initWorker() {
    // Create worker
    this.worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), {
      type: 'module',
    });

    // Set up message handling
    this.worker.onmessage = (event) => {
      const { type, id, text, results, error } = event.data;

      switch (type) {
        case 'READY':
          // Handled by the promise wrapper below (actually we can't resolve it here easily without a deferred,
          // so we'll just handle it via the init flow)
          break;
        case 'STDOUT':
          this.onStdout?.(text);
          break;
        case 'STDERR':
          this.onStderr?.(text);
          break;
        case 'RESULTS':
          const pending = this.pendingRuns.get(id);
          if (pending) {
            if (error) {
              pending.reject(new Error(error));
            } else {
              pending.resolve(results);
            }
            this.pendingRuns.delete(id);
          }
          break;
        case 'ERROR':
            console.error("Pyodide Worker Error:", error);
            break;
      }
    };

    // Send init message
    this.workerReadyPromise = new Promise((resolve, reject) => {
        const handler = (event: MessageEvent) => {
            if (event.data.type === 'READY') {
                this.worker?.removeEventListener('message', handler);
                resolve();
            } else if (event.data.type === 'ERROR') {
                this.worker?.removeEventListener('message', handler);
                reject(new Error(event.data.error));
            }
        };
        this.worker?.addEventListener('message', handler);

        this.worker?.postMessage({
            type: 'INIT',
            config: {
                indexURL: INDEX_URL,
                scriptURL: SCRIPT_URL
            }
        });
    });
  }

  private runPythonAsync(code: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const id = Math.random().toString(36).substring(7);
      this.pendingRuns.set(id, { resolve, reject });

      this.worker.postMessage({
        type: 'RUN',
        id,
        code
      });
    });
  }
}

export const pyodideManager = PyodideManager.getInstance();
