import { describe, expect, test } from "bun:test";
import { displayCategory, displayLevel } from "@/lib/categoryLabels";

describe("displayCategory", () => {
  test("maps stored Indonesian categories to English labels", () => {
    expect(displayCategory("AI Dasar")).toBe("AI Basics");
    expect(displayCategory("Umum")).toBe("General");
    expect(displayCategory("Lainnya")).toBe("Other");
    expect(displayCategory("Matematika")).toBe("Mathematics");
    expect(displayCategory("Teknologi")).toBe("Technology");
  });

  test("passes through already-English categories unchanged", () => {
    expect(displayCategory("Automation")).toBe("Automation");
    expect(displayCategory("Prompt Engineering")).toBe("Prompt Engineering");
  });

  test("renders unknown stored values as-is", () => {
    expect(displayCategory("Robotika")).toBe("Robotika");
  });

  test("handles empty input", () => {
    expect(displayCategory("")).toBe("");
    expect(displayCategory(null)).toBe("");
    expect(displayCategory(undefined)).toBe("");
  });
});

describe("displayLevel", () => {
  test("maps stored Indonesian levels to English labels", () => {
    expect(displayLevel("Pemula")).toBe("Beginner");
    expect(displayLevel("Menengah")).toBe("Intermediate");
    expect(displayLevel("Lanjutan")).toBe("Advanced");
  });

  test("renders unknown stored values as-is", () => {
    expect(displayLevel("Dewa")).toBe("Dewa");
  });

  test("handles empty input", () => {
    expect(displayLevel("")).toBe("");
    expect(displayLevel(null)).toBe("");
    expect(displayLevel(undefined)).toBe("");
  });
});
