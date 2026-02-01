import { useState, useEffect } from "react";

/**
 * usePerformance - Unified hook to detect device capability and user preferences
 *
 * Target: Low-to-mid range mobile devices
 */

export interface PerformanceStats {
    isLowEnd: boolean;
    prefersReducedMotion: boolean;
    isTouchDevice: boolean;
    deviceMemory?: number;
    hardwareConcurrency?: number;
}

export function isLowEndDevice(): boolean {
    if (typeof window === "undefined") return true;

    // 1. Check device memory (in GB) - available in Chromium browsers
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory && deviceMemory <= 4) return true;

    // 2. Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;

    // 3. Check for slow connection or Data Saver mode
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (connection) {
        if (connection.saveData) return true;
        if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g" || connection.effectiveType === "3g") return true;
    }

    return false;
}

export function usePerformance(): PerformanceStats {
    const [stats, setStats] = useState<PerformanceStats>({
        isLowEnd: false,
        prefersReducedMotion: false,
        isTouchDevice: false
    });

    useEffect(() => {
        const checkPerformance = () => {
            const lowEnd = isLowEndDevice();
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const touch = !window.matchMedia("(hover: hover)").matches || !window.matchMedia("(pointer: fine)").matches;

            setStats({
                isLowEnd: lowEnd,
                prefersReducedMotion: reducedMotion,
                isTouchDevice: touch,
                deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
                hardwareConcurrency: navigator.hardwareConcurrency
            });
        };

        checkPerformance();

        // Listen for changes in reduced motion preference
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = () => checkPerformance();
        mediaQuery.addEventListener("change", handler);

        // Listen for resize to re-check touch/hover (e.g. tablet rotation)
        window.addEventListener("resize", checkPerformance);

        return () => {
            mediaQuery.removeEventListener("change", handler);
            window.removeEventListener("resize", checkPerformance);
        };
    }, []);

    return stats;
}
