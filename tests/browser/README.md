# Request review behavior tests

Run from the repository root:

```sh
bunx playwright install chromium
bunx playwright test --config tests/browser/playwright.config.ts
```

The config starts Vite on port 4175 and renders the production RequestReviewPanel in a test-only HTML entry. Inputs and callbacks are in-memory fixtures: no login, live user data, Supabase queries, AI generation or database writes. The fixture is not a production route and is not a Vite build entry.

Tests cover Admin/Tutor column differences, raw status/filter callbacks, generation eligibility, confirmation/cancel/latest request ID, disabled/loading/empty states, and date rendering. Desktop/mobile screenshots land in Playwright's test-results folder. This proves shared-component behavior, not the full authenticated dashboard or backend permissions.
