import { describe, expect, it } from "bun:test";
import { validatePayload, ValidationError } from "./validation.ts";

describe("validatePayload", () => {
    it("should validate a correct payload", () => {
        const input = {
            title: "Test Title",
            content: "Test Content",
            tags: ["tag1", "tag2"]
        };
        const result = validatePayload(input);
        expect(result.title).toBe("Test Title");
        expect(result.content).toBe("Test Content");
        expect(result.tags).toHaveLength(2);
    });

    it("should throw ValidationError if title is missing", () => {
        const input = {
            content: "Test Content"
        };
        expect(() => validatePayload(input)).toThrow(ValidationError);
        expect(() => validatePayload(input)).toThrow("'title' is required");
    });

    it("should throw ValidationError if content is missing", () => {
        const input = {
            title: "Test Title"
        };
        expect(() => validatePayload(input)).toThrow(ValidationError);
        expect(() => validatePayload(input)).toThrow("'content' is required");
    });

    it("should throw ValidationError if tags is not an array", () => {
        const input = {
            title: "Test Title",
            content: "Test Content",
            tags: "not-an-array"
        };
        expect(() => validatePayload(input)).toThrow(ValidationError);
    });

    it("should trim title and limit length", () => {
         const longTitle = "a".repeat(300);
         const input = {
             title: longTitle,
             content: "content"
         };
         const result = validatePayload(input);
         expect(result.title.length).toBe(200);
    });
});
