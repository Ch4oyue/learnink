import { describe, it, expect } from "bun:test";
import { cn } from "../../../src/lib/utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    const result = cn("bg-red-500", "text-white");
    expect(result).toBe("bg-red-500 text-white");
  });

  it("should handle conditional classes", () => {
    const condition = true;
    const result = cn("bg-red-500", condition && "text-white", !condition && "hidden");
    expect(result).toBe("bg-red-500 text-white");
  });

  it("should merge tailwind classes properly (override)", () => {
    // twMerge should let the last conflicting class win
    const result = cn("p-4 bg-red-500", "p-8");
    expect(result).toBe("bg-red-500 p-8");
  });

  it("should handle arrays and objects", () => {
    const result = cn(["bg-red-500", "text-white"], { "p-4": true, "hidden": false });
    expect(result).toBe("bg-red-500 text-white p-4");
  });
});
