# Bolt's Journal ⚡

## Mission Log

### [2024-05-21] Initial Performance Audit
- **Baseline Build Stats**:
    - `vendor-radix`: 284.25 kB (gzip: 89.68 kB) - **TOO LARGE**
    - `vendor-supabase`: 170.51 kB (gzip: 44.46 kB)
    - `LandingPage`: 129.37 kB (gzip: 50.47 kB)
    - `vendor-motion`: 121.52 kB (gzip: 40.08 kB)
    - `Auth`: 101.11 kB (gzip: 28.09 kB)

- **Findings**:
    - The current `vite.config.ts` forces all `@radix-ui` packages into a single `vendor-radix` chunk. This means a user visiting a simple page downloads code for Dialogs, Tabs, Popovers, etc., even if unused.
    - `LandingPage` is heavy, likely due to eager imports of many UI components.

- **Action Plan**:
    - Optimize `vite.config.ts` splitting strategy.
    - Allow Vite/Rollup to split Radix UI components based on usage (Route-based splitting) rather than a monolithic vendor file.

### [2025-01-28] Bundler Optimization Implementation
- **Action**: Refactored `vite.config.ts` to implement granular code splitting strategy.
- **Results**:
    - **React Core (Critical Path)**: Reduced from ~319 kB to **211.56 kB** (33% Reduction).
    - **UI Isolation**: Removed forced grouping for `@radix-ui` and `lucide-react`. Components like `select` (22kB) and `dropdown-menu` (25kB) are now loaded on-demand.
    - **Animation**: Isolated `framer-motion` and `gsap` into `vendor-animation` (235 kB).
    - **Utils**: Isolated `zod` and `date-fns` into `vendor-utils` (107 kB) to enable better caching.
- **Key Takeaway**: Allowing Vite to handle UI component splitting naturally (instead of forcing a vendor chunk) significantly improves the critical path size.

### [2026-02-01] Pyodide Initialization Optimization
- **Action**: Implemented `usePyodidePreload` hook in `ModuleLearn.tsx`.
- **Reasoning**: Pyodide is a heavy dependency. Previous implementation waited for user focus on the editor to load it, causing a delay.
- **Implementation**: The new hook checks if the module content contains Python code blocks (` ```python `) and triggers a low-priority background load using `requestIdleCallback` (or `setTimeout` fallback).
- **Result**: The Python environment is initialized during reading time, making the editor "instantly" ready when accessed.

### [2026-02-14] Syntax Highlighter Optimization
- **Action**: Refactored `MarkdownRenderer.tsx` to use `prism-light` and manual language registration.
- **Reasoning**: The default `react-syntax-highlighter` import includes all languages, resulting in a ~756kB chunk.
- **Implementation**: Switched to `react-syntax-highlighter/dist/esm/prism-light` and registered only used languages (python, js, ts, bash, json, css, html, markdown).
- **Result**: `MarkdownRenderer` chunk size reduced from **756.57 kB** to **189.29 kB** (**75% reduction**).

### [2026-02-15] ModuleEditor Re-render Optimization
- **Action**: Refactored `ModuleEditor.tsx` to eliminate excessive re-renders.
- **Reasoning**: The previous implementation used a root-level `watch()` from `react-hook-form`, causing the entire editor (including settings inputs and the heavy icon grid) to re-render on every keystroke in the main content `Textarea`.
- **Implementation**: Removed root-level `watch()`. Extracted dynamic UI sections into isolated components (`ModulePreviewCard` and `ModuleContentPreview`) that use `useWatch` internally. This isolates the re-render scope to only the components that actually need the data.
- **Result**: Typing in the Markdown editor no longer triggers re-renders of the Settings Card or Icon Grid, significantly improving responsiveness on large modules.
