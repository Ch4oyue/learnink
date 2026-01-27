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

// Extended list of sensitive keys to redact
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "api_key",
  "secret",
  "authorization",
  "cookie",
  "session",
  "creditcard",
  "cvv",
  "passwd"
]);

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
 * Sanitize sensitive data before logging (Recursive)
 * Masks common sensitive fields like tokens, passwords, etc.
 */
export function sanitize(data: unknown, seen = new WeakSet()): unknown {
    if (typeof data === "string") {
        return data;
    }

    if (typeof data !== "object" || data === null) {
        return data;
    }

    if (seen.has(data)) {
        return "[Circular Reference]";
    }
    seen.add(data);

    if (Array.isArray(data)) {
        return data.map(item => sanitize(item, seen));
    }

    const sanitized: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const lowerKey = key.toLowerCase();
            // Check exact match or contains keywords
            if (SENSITIVE_KEYS.has(lowerKey) ||
                lowerKey.includes('token') ||
                lowerKey.includes('password') ||
                lowerKey.includes('secret')) {
                sanitized[key] = "[REDACTED]";
            } else {
                sanitized[key] = sanitize(obj[key], seen);
            }
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
            // Note: pass explicit arrow function to avoid passing index/array from map to sanitize
            console.log("[LearnInk]", ...args.map(arg => sanitize(arg)));
        }
    },

    /**
     * Log warning messages (dev only)
     */
    warn: (...args: unknown[]): void => {
        if (isDev) {
            console.warn("[LearnInk WARN]", ...args.map(arg => sanitize(arg)));
        }
    },

    /**
     * Log error messages
     * In production, could be extended to send to monitoring service
     */
    error: (...args: unknown[]): void => {
        if (isDev) {
            console.error("[LearnInk ERROR]", ...args.map(arg => sanitize(arg)));
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
            console.info("[LearnInk INFO]", ...args.map(arg => sanitize(arg)));
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
