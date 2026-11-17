import { describe, expect, it } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// This checks the current tracked tree, not published history or credential validity.
// Keep real test-account logins in a password manager, never repository notes.
describe("credential document guardrail", () => {
  it("does not track credential notes in project context", () => {
    const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0");
    expect(paths.filter((path) => /^\.project-context\/.*credentials?/i.test(path))).toEqual([]);
  });

  it("ignores private credential notes even without a local secret scanner", () => {
    const ignore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
    expect(ignore.split("\n")).toContain("/.project-context/*credentials*");
  });
});
