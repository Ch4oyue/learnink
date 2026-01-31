import { expect, test } from "bun:test";
import { readFileSync } from "fs";

test("MarkdownRenderer passes props to ordered list", () => {
  const content = readFileSync("src/components/shared/MarkdownRenderer.tsx", "utf-8");
  // Check for ol taking ...props and spreading it
  // Pattern: ol: ({ children, ...props }) => <ol ... {...props}>
  // We look for '...props' inside the arguments and inside the JSX tag
  const hasPropsArg = /ol:\s*\(\{\s*children,\s*\.\.\.props\s*\}\)/.test(content);
  const hasPropsSpread = /<ol[^>]*\{\.\.\.props\}/.test(content);

  expect(hasPropsArg).toBe(true);
  expect(hasPropsSpread).toBe(true);
});
