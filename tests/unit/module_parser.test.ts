import { describe, it, expect } from "bun:test";
import { parseModuleSections } from "@/lib/moduleParser";

describe("parseModuleSections", () => {
  it("should return empty object for empty string", () => {
    const { sections, order } = parseModuleSections("");
    expect(sections).toEqual({});
    expect(order).toEqual([]);
  });

  it("should parse a single section", () => {
    const markdown = "# Introduction\nWelcome to the course.";
    const { sections, order } = parseModuleSections(markdown);

    expect(order.length).toBe(1);
    expect(order[0]).toBe("introduction");
    expect(sections["introduction"].title).toBe("Introduction");
    expect(sections["introduction"].content).toContain("Welcome to the course.");
  });

  it("should parse multiple sections", () => {
    const markdown = `
# Section 1
Content 1.

## Subsection A
Content A.

# Section 2
Content 2.
    `.trim();

    const { sections, order } = parseModuleSections(markdown);

    expect(order.length).toBe(3);
    expect(order).toEqual(["section-1", "subsection-a", "section-2"]);

    expect(sections["section-1"].level).toBe(1);
    expect(sections["subsection-a"].level).toBe(2);
    expect(sections["section-2"].level).toBe(1);
  });

  it("should handle duplicates via slug uniqueness (simple check)", () => {
    // Note: The implementation uses random string for duplicates, so we just check order length
    const markdown = `
# Section
Content 1.

# Section
Content 2.
    `.trim();

    const { order } = parseModuleSections(markdown);
    expect(order.length).toBe(2);
    expect(order[0]).not.toBe(order[1]);
    expect(order[0]).toContain("section");
    expect(order[1]).toContain("section");
  });
});
