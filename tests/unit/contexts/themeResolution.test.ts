import { describe, expect, test } from "bun:test";
import { resolveTheme } from "@/lib/themeResolution";

describe("resolveTheme", () => {
  test("uses the stored dark choice on the first render", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  test("uses the stored light choice even when the system prefers dark", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  test("follows the system preference only for the system choice", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});
