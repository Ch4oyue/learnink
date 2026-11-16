import { useEffect, useState } from "react";

/**
 * usePerformance - device capability detection shared by the whole app.
 *
 * Devices are grouped into three tiers so effects can be dialled per class of
 * hardware instead of an all-or-nothing "low-end" flag:
 *
 *   low   - drop blur/glow/looping motion, no decorative cursor, no prefetch,
 *           no Pyodide preload, static hero (no typing, no entrance animation)
 *   mid   - lighter glass, keep entrance animations, no heavy prefetch
 *   high  - everything on
 *
 * One module-level store feeds every consumer, so N components no longer mean
 * N matchMedia/resize listener pairs, and the tier is also published to the
 * document as `data-perf` so CSS can adapt.
 */

export type PerformanceTier = "low" | "mid" | "high";

export interface PerformanceStats {
    tier: PerformanceTier;
    isLowEnd: boolean;
    prefersReducedMotion: boolean;
    isTouchDevice: boolean;
    deviceMemory?: number;
    hardwareConcurrency?: number;
}

type NetworkInformation = {
    effectiveType?: string;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
};

const DEFAULT_STATS: PerformanceStats = {
    tier: "high",
    isLowEnd: false,
    prefersReducedMotion: false,
    isTouchDevice: false,
};

function matches(query: string): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
}

function computeTier(): PerformanceTier {
    if (typeof navigator === "undefined") return "high";

    const navigator_ = navigator as Navigator & {
        deviceMemory?: number;
        connection?: NetworkInformation;
    };
    const memory = navigator_.deviceMemory;
    const cores = navigator_.hardwareConcurrency;
    const connection = navigator_.connection;

    // Data Saver or a genuinely slow link: treat as low regardless of CPU.
    if (connection?.saveData) return "low";
    if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return "low";

    if (typeof memory === "number" && memory <= 2) return "low";
    if (typeof cores === "number" && cores <= 2) return "low";

    if (connection?.effectiveType === "3g") return "mid";
    if (typeof memory === "number" && memory <= 4) return "mid";
    if (typeof cores === "number" && cores <= 4) return "mid";

    return "high";
}

function computeStats(): PerformanceStats {
    if (typeof window === "undefined") return DEFAULT_STATS;

    const tier = computeTier();
    const navigator_ = typeof navigator === "undefined"
        ? undefined
        : (navigator as Navigator & { deviceMemory?: number });

    return {
        tier,
        isLowEnd: tier === "low",
        prefersReducedMotion: matches("(prefers-reduced-motion: reduce)"),
        isTouchDevice: !matches("(hover: hover)") || !matches("(pointer: fine)"),
        deviceMemory: navigator_?.deviceMemory,
        hardwareConcurrency: navigator_?.hardwareConcurrency,
    };
}

let currentStats: PerformanceStats = typeof window === "undefined" ? DEFAULT_STATS : computeStats();
const subscribers = new Set<() => void>();

function publish(next: PerformanceStats) {
    currentStats = next;
    if (typeof document !== "undefined") {
        document.documentElement.dataset.perf = next.tier;
        document.documentElement.dataset.reducedMotion = String(next.prefersReducedMotion);
    }
    subscribers.forEach((notify) => notify());
}

function refresh() {
    const next = computeStats();
    if (
        next.tier !== currentStats.tier ||
        next.prefersReducedMotion !== currentStats.prefersReducedMotion ||
        next.isTouchDevice !== currentStats.isTouchDevice
    ) {
        publish(next);
    }
}

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    publish(currentStats);

    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", refresh);
    window.matchMedia("(hover: hover)").addEventListener("change", refresh);
    window.matchMedia("(pointer: fine)").addEventListener("change", refresh);
    window.addEventListener("resize", refresh);

    const connection = typeof navigator === "undefined"
        ? undefined
        : (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener?.("change", refresh);
}

function subscribe(onStoreChange: () => void) {
    subscribers.add(onStoreChange);
    return () => {
        subscribers.delete(onStoreChange);
    };
}

/** Read the current tier outside of React. */
export function getPerformanceTier(): PerformanceTier {
    return currentStats.tier;
}

export function isLowEndDevice(): boolean {
    return currentStats.tier === "low";
}

export function usePerformance(): PerformanceStats {
    const [stats, setStats] = useState<PerformanceStats>(currentStats);

    useEffect(() => {
        // Sync in case the tier changed between render and subscribe.
        setStats(currentStats);
        return subscribe(() => setStats(currentStats));
    }, []);

    return stats;
}
