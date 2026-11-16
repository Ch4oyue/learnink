import { useCallback } from "react";
import { getPerformanceTier } from "./usePerformance";

/**
 * usePrefetch - Utility to prefetch lazy components
 * Only executes on high-tier devices: on low and mid hardware (and slow links,
 * which land in those tiers) an extra route download competes with real work.
 */
export function usePrefetch() {
    const prefetch = useCallback((factory: () => Promise<unknown>) => {
        if (getPerformanceTier() !== "high") return;

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
