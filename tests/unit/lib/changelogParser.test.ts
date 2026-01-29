import { describe, it, expect } from "bun:test";
import { parseChangelogContent, parseVersionSummaryContent } from "../../../src/lib/changelogParser";

describe("Changelog Parser", () => {
  const mockChangelog = `
# LearnInk Changelog

All notable changes...

---

## [1.4.9] - January 29, 2026

### Audit & Stability

Comprehensive security audit.

<!-- -->

#### Patches
- **Environment Fix**: Resolved missing dependency issues.
- **Audit Verification**: Verified all systems.

## [1.4.8] - January 28, 2026

### Admin UX

Major improvements.

#### Improvements
- **Review Split View**: Implemented split view.

#### Fixes
- **Broken Access**: Fixed vulnerability.

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.9 | Jan 29, 2026 | Audit & Stability |
| 1.4.8 | Jan 28, 2026 | Admin UX |
  `;

  it("should parse versions correctly", () => {
    const entries = parseChangelogContent(mockChangelog);
    expect(entries.length).toBe(2);
    expect(entries[0].version).toBe("1.4.9");
    expect(entries[1].version).toBe("1.4.8");
  });

  it("should parse dates and format them", () => {
    const entries = parseChangelogContent(mockChangelog);
    expect(entries[0].date).toBe("Jan 29, 2026");
  });

  it("should parse titles and descriptions", () => {
    const entries = parseChangelogContent(mockChangelog);
    expect(entries[0].title).toBe("Audit & Stability");
    expect(entries[0].description).toContain("Comprehensive security audit");
  });

  it("should parse categories (patches, improvements, fixes)", () => {
    const entries = parseChangelogContent(mockChangelog);

    // 1.4.9 has Patches
    expect(entries[0].patches.length).toBe(2);
    expect(entries[0].patches[0]).toContain("Environment Fix");

    // 1.4.8 has Improvements and Fixes
    expect(entries[1].improvements.length).toBe(1);
    expect(entries[1].fixes.length).toBe(1);
  });

  it("should parse version summary table", () => {
    const summary = parseVersionSummaryContent(mockChangelog);
    expect(summary.length).toBe(2);
    expect(summary[0].version).toBe("1.4.9");
    expect(summary[0].highlights).toBe("Audit & Stability");
  });
});
