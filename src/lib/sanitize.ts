/**
 * Input sanitization utilities
 * Provides consistent sanitization for user-generated content
 */

/**
 * Sanitize a string by trimming whitespace and limiting length
 */
export function sanitizeString(
    input: string,
    maxLength: number = 1000
): string {
    if (typeof input !== "string") {
        return "";
    }
    return input.trim().slice(0, maxLength);
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(email: string): string {
    return sanitizeString(email, 255).toLowerCase();
}

/**
 * Validate and sanitize a UUID
 */
export function sanitizeUUID(uuid: string): string | null {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const trimmed = sanitizeString(uuid, 36);
    return uuidRegex.test(trimmed) ? trimmed : null;
}

/**
 * Sanitize a numeric string to ensure it's a valid positive integer
 */
export function sanitizePositiveInteger(
    input: string | number,
    fallback: number = 0
): number {
    const num = typeof input === "string" ? parseInt(input, 10) : input;
    return Number.isFinite(num) && num >= 0 ? Math.floor(num) : fallback;
}

/**
 * Escape HTML special characters to prevent XSS
 * Note: DOMPurify is used for rich content, this is for simple text
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Validate that a value is a non-empty string after sanitization
 */
export function isValidNonEmptyString(
    value: unknown,
    minLength: number = 1
): value is string {
    return (
        typeof value === "string" &&
        value.trim().length >= minLength
    );
}
