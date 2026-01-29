import { mock } from "bun:test";

mock.module("/CHANGELOG.md?raw", () => ({
  default: "# Mock Changelog"
}));

mock.module("../../CHANGELOG.md?raw", () => ({
  default: "# Mock Changelog"
}));
