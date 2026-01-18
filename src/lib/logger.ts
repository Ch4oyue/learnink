/**
 * Production-safe logging utility
 * 
 * Suppresses all console output in production builds.
 * Use this instead of console.log/warn/error throughout the app.
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.log('Debug info:', data);
 * logger.warn('Warning message');
 * logger.error('Error occurred:', error);
 */

const isDev = import.meta.env.DEV;

/**
 * Safely stringify objects for logging (handles circular refs)
 */
function safeStringify(obj: unknown): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    }, 2);
}

/**
 * Sanitize sensitive data before logging
 * Masks common sensitive fields like tokens, passwords, etc.
 */
function sanitize(data: unknown): unknown {
    if (typeof data === "string") {
        return data;
    }

    if (typeof data !== "object" || data === null) {
        return data;
    }

    const sensitiveFields = [
        "password",
        "token",
        "accessToken",
        "refreshToken",
        "apiKey",
        "api_key",
        "secret",
        "authorization",
        "cookie",
        "session",
    ];

    const sanitized = { ...data as Record<string, unknown> };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = "[REDACTED]";
        }
    }

    return sanitized;
}

export const logger = {
    /**
     * Log general debug information (dev only)
     */
    log: (...args: unknown[]): void => {
        if (isDev) {
            console.log("[LearnInk]", ...args.map(sanitize));
        }
    },

    /**
     * Log warning messages (dev only)
     */
    warn: (...args: unknown[]): void => {
        if (isDev) {
            console.warn("[LearnInk WARN]", ...args.map(sanitize));
        }
    },

    /**
     * Log error messages
     * In production, could be extended to send to monitoring service
     */
    error: (...args: unknown[]): void => {
        if (isDev) {
            console.error("[LearnInk ERROR]", ...args.map(sanitize));
        } else {
            // In production: optionally send to error monitoring service
            // Example: Sentry, LogRocket, etc.
            // sendToMonitoring('error', args);
        }
    },

    /**
     * Log info messages (dev only)
     */
    info: (...args: unknown[]): void => {
        if (isDev) {
            console.info("[LearnInk INFO]", ...args.map(sanitize));
        }
    },

    /**
     * Log debug messages with object inspection (dev only)
     */
    debug: (label: string, data: unknown): void => {
        if (isDev) {
            console.log(`[LearnInk DEBUG] ${label}:`, safeStringify(sanitize(data)));
        }
    },

    /**
     * Log performance timing (dev only)
     */
    time: (label: string): void => {
        if (isDev) {
            console.time(`[LearnInk PERF] ${label}`);
        }
    },

    timeEnd: (label: string): void => {
        if (isDev) {
            console.timeEnd(`[LearnInk PERF] ${label}`);
        }
    },

    /**
     * Group related logs together (dev only)
     */
    group: (label: string): void => {
        if (isDev) {
            console.group(`[LearnInk] ${label}`);
        }
    },

    groupEnd: (): void => {
        if (isDev) {
            console.groupEnd();
        }
    },
};

export default logger;
