import { useCallback } from "react";
import { isLowEndDevice } from "./usePerformance";

/**
 * usePrefetch - Utility to prefetch lazy components
 * Only executes if device is NOT low-end and connection is NOT slow.
 */
export function usePrefetch() {
    const prefetch = useCallback((factory: () => Promise<unknown>) => {
        if (isLowEndDevice()) return;

        // Execute the factory function to trigger component download
        // We don't care about the result, just that the browser starts fetching it.
        try {
            factory();
        } catch (e) {
            // Ignore errors
        }
    }, []);

    return prefetch;
}
