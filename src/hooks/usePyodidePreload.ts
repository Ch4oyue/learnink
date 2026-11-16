import { useEffect } from "react";
import { pyodideManager } from "@/lib/pyodide-manager";
import { getPerformanceTier } from "./usePerformance";

/**
 * Smartly preloads Pyodide runtime if the content contains Python code blocks.
 * Uses requestIdleCallback to avoid blocking the main thread during initial render.
 * Skips preloading on low-end devices to save network and memory.
 */
export function usePyodidePreload(content?: string) {
  useEffect(() => {
    // The runtime is multi-megabyte: only preload it on high-tier devices, where
    // it will not compete with the module payload. Everyone else loads it on demand.
    if (getPerformanceTier() !== "high") return;

    const timeoutId = setTimeout(() => {
      if (content?.includes('```python')) {
        const preload = () => {
          // We catch errors here to prevent unhandled promise rejections,
          // but the manager logs errors internally anyway.
          pyodideManager.load().catch(() => {});
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).requestIdleCallback(preload);
        } else {
          // Fallback for browsers without requestIdleCallback or if window is undefined
          setTimeout(preload, 2000);
        }
      }
    }, 1000); // Debounce check by 1s

    return () => clearTimeout(timeoutId);
  }, [content]);
}
