
import { describe, test, expect } from "bun:test";
import { performance } from "perf_hooks";
import { parseModuleSections } from "../../src/lib/moduleParser";

// Mock Data
const SAMPLE_MARKDOWN = `
# Introduction to React
React is a JavaScript library for building user interfaces.

## Components
Components are the building blocks of React applications.

### Functional Components
Functional components are simple functions that return JSX.

## State and Props
State and props are used to manage data in React.

# Advanced Topics
Hooks, Context, and more.

## Hooks
Hooks allow you to use state and other React features without writing a class.

### useState
useState is a Hook that lets you add React state to function components.

### useEffect
useEffect lets you perform side effects in function components.
`.repeat(100);

interface SectionData {
  id: string;
  title: string;
  level: number;
  content: string;
}

// Case 1: Regex Inside (Baseline / Old Implementation)
function parseWithRegexInside(markdown: string) {
  if (!markdown) return { sections: {}, order: [] };

  const lines = markdown.split("\n");
  const sections: Record<string, SectionData> = {};
  const order: string[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/;

  let currentSection: SectionData | null = null;
  let contentLines: string[] = [];

  const saveCurrentSection = () => {
    if (currentSection) {
      currentSection.content = contentLines.join("\n").trim();
      sections[currentSection.id] = currentSection;
      order.push(currentSection.id);
    }
  };

  for (const line of lines) {
    const match = line.match(headingRegex);

    if (match) {
      saveCurrentSection();
      const level = match[1].length;
      const title = match[2].trim();
      const id = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      const uniqueId = sections[id] ? `${id}-${Math.random().toString(36).substr(2, 5)}` : id;

      currentSection = { id: uniqueId, title, level, content: "" };
      contentLines = [line];
    } else {
      contentLines.push(line);
    }
  }
  saveCurrentSection();
  return { sections, order };
}

describe("Markdown Parsing Performance Benchmark", () => {
  test("compares Regex Inside vs Hoisted Regex + Exec (Actual Implementation)", () => {
    const ITERATIONS = 200; // Reduced to avoid CI timeouts
    console.log("\n--- Starting Regex Benchmark ---");
    console.log(`Iterations: ${ITERATIONS}`);

    // Warmup
    parseWithRegexInside(SAMPLE_MARKDOWN);
    parseModuleSections(SAMPLE_MARKDOWN);

    // Measure Optimized (Actual Code)
    const startOptimized = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      parseModuleSections(SAMPLE_MARKDOWN);
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // Measure Baseline (Old Code Simulation)
    const startBaseline = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      parseWithRegexInside(SAMPLE_MARKDOWN);
    }
    const endBaseline = performance.now();
    const timeBaseline = endBaseline - startBaseline;

    console.log(`Baseline (Regex Inside):   ${timeBaseline.toFixed(2)}ms`);
    console.log(`Optimized (Hoisted+Exec):  ${timeOptimized.toFixed(2)}ms`);

    const improvement = ((timeBaseline - timeOptimized) / timeBaseline) * 100;
    console.log(`Improvement:               ${improvement.toFixed(2)}% faster`);

    // Basic assertion that it works
    const result = parseModuleSections("# Test\nContent");
    expect(result.sections).toHaveProperty("test");
  });
});
