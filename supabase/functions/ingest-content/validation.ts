export interface IngestPayload {
    title: string;
    content: string;
    tags?: string[];
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export function validatePayload(body: unknown): IngestPayload {
    if (!body || typeof body !== "object") {
        throw new ValidationError("Request body must be a JSON object");
    }

    const payload = body as Record<string, unknown>;

    if (!payload.title || typeof payload.title !== "string") {
        throw new ValidationError("'title' is required and must be a string");
    }

    if (!payload.content || typeof payload.content !== "string") {
        throw new ValidationError("'content' is required and must be a string");
    }

    // Sanitize title (max 200 chars)
    const title = payload.title.trim().substring(0, 200);
    if (!title) {
        throw new ValidationError("'title' cannot be empty");
    }

    // Sanitize content (max 50KB)
    const content = payload.content.trim().substring(0, 50000);

    // Validate tags if provided
    let tags: string[] = [];
    if (payload.tags) {
        if (!Array.isArray(payload.tags)) {
            throw new ValidationError("'tags' must be an array of strings");
        }
        tags = payload.tags
            .filter((t): t is string => typeof t === "string")
            .map((t) => t.trim().substring(0, 50))
            .slice(0, 10); // Max 10 tags
    }

    return { title, content, tags };
}
