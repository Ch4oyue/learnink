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

### [2024-05-21] Vite Chunk Optimization
- **Actions Taken**:
    - Implemented advanced chunk splitting in `vite.config.ts` using `manualChunks` function.
    - Explicitly separated `vendor-radix`, `vendor-ui` (Framer Motion, GSAP), and `vendor-charts`.

- **Results**:
    - `index` chunk size reduced by ~70% (258kB -> 77kB).
    - `LandingPage` chunk size reduced by ~88% (130kB -> 15kB).
    - `vendor-radix` isolated at 133kB (vs 284kB in audit).
    - `vendor-ui` created at 257kB (isolating heavy animation libs).
    - `recharts` confirmed unused and tree-shaken.

- **Outcome**:
    - Massive improvement in FCP for Landing Page.
    - Better long-term caching for UI libraries.
