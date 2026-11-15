
import { describe, expect, test } from "bun:test";
import { extractListItems } from "../../../src/lib/changelogUtils";

describe("changelogParser", () => {
  describe("extractListItems", () => {
    test("should extract items from a valid block", () => {
      const block = `
## [1.0.0] - 2024-01-01
### Update

#### Improvements
- Item 1
- Item 2
`;
      const result = extractListItems(block, "Improvements");
      expect(result).toEqual(["Item 1", "Item 2"]);
    });

    test("should return empty array if header not found", () => {
      const block = "Some content without header";
      const result = extractListItems(block, "Missing");
      expect(result).toEqual([]);
    });

    test("should handle items with code blocks", () => {
        const block = `
#### Fixes
- Fixed \`bug\` in parser
`;
        const result = extractListItems(block, "Fixes");
        expect(result).toEqual(["Fixed `bug` in parser"]);
    });

    test("should sanitize dangerous content", () => {
        const block = `
#### Security
- <script>alert('xss')</script>Normal text
- javascript:void(0)
`;
        const result = extractListItems(block, "Security");
        expect(result).toEqual(["Normal text", "void(0)"]); // aggressive replacement
    });

    test("should stop at next section", () => {
        const block = `
#### Improvements
- Item 1

#### Fixes
- Item 2
`;
        const result = extractListItems(block, "Improvements");
        expect(result).toEqual(["Item 1"]);
    });

    test("should stop at separator", () => {
        const block = `
#### Improvements
- Item 1

---
`;
        const result = extractListItems(block, "Improvements");
        expect(result).toEqual(["Item 1"]);
    });

    test("should cache regex instances (indirect test)", () => {
        // This is hard to test directly without mocking Map, but we can ensure
        // calling it multiple times works correctly (sanity check for the cache logic)
        const block = `
#### Improvements
- Item 1
`;
        const r1 = extractListItems(block, "Improvements");
        const r2 = extractListItems(block, "Improvements");
        expect(r1).toEqual(r2);
    });
  });
});
