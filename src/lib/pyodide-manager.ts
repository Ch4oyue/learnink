
interface PyodideConfig {
  indexURL: string;
}

declare global {
  interface Window {
    loadPyodide: (config: PyodideConfig) => Promise<any>;
    pyodide: any;
  }
}

const PYODIDE_VERSION = "v0.26.1";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const SCRIPT_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`;

class PyodideManager {
  private static instance: PyodideManager;
  private pyodidePromise: Promise<any> | null = null;

  private constructor() {}

  public static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager();
    }
    return PyodideManager.instance;
  }

  public async load(): Promise<any> {
    if (this.pyodidePromise) {
      return this.pyodidePromise;
    }

    this.pyodidePromise = this.initializePyodide();
    return this.pyodidePromise;
  }

  private async initializePyodide(): Promise<any> {
    // 1. Load the script if necessary
    if (!window.loadPyodide) {
      await this.loadScript();
    }

    // 2. Initialize Pyodide
    if (!window.loadPyodide) {
        throw new Error("Pyodide script loaded but window.loadPyodide is missing");
    }

    const pyodide = await window.loadPyodide({
      indexURL: INDEX_URL,
    });

    // 3. Set global reference
    window.pyodide = pyodide;

    return pyodide;
  }

  private loadScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Pyodide script"));
      document.head.appendChild(script);
    });
  }
}

export const pyodideManager = PyodideManager.getInstance();
