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
