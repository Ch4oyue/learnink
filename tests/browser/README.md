# Request review behavior tests

Run from the repository root:

```sh
bunx playwright install chromium
bunx playwright test --config tests/browser/playwright.config.ts
```

The config starts Vite on port 4175 and renders the production RequestReviewPanel in a test-only HTML entry. Inputs and callbacks are in-memory fixtures: no login, live user data, Supabase queries, AI generation or database writes. The fixture is not a production route and is not a Vite build entry.

Tests cover Admin/Tutor column differences, raw status/filter callbacks, generation eligibility, confirmation/cancel/latest request ID, disabled/loading/empty states, and date rendering. Desktop/mobile screenshots land in Playwright's test-results folder. This proves shared-component behavior, not the full authenticated dashboard or backend permissions.

## Authenticated page flows (in-memory Supabase stand-in)

```sh
bunx playwright install chromium
bunx playwright test --config tests/browser/playwright.app.config.ts
```

`playwright.app.config.ts` starts Vite on port 4176 with placeholder Supabase env and runs `tests/browser/*.app.ts`. `support/app.ts` answers every request to the placeholder host from an in-memory table store, signs a fixture user in through localStorage, and applies PATCH / DELETE / POST to the store so tests can assert real state changes (not only that a request fired). Tests run at 1440 and 390 px widths.

Covered: notifications (mark one / all read, tap-through to a module and to the requests list), Second Brain (list, search, module filter, delete), Settings (theme persistence, mobile transparent-nav toggle), Requests (tabs, search, status filter, create), Courses (catalog search and enrolled state, course detail progress and locked state, Take Course enrolls and opens unlocked).

Limit: this exercises page behavior against stubbed PostgREST responses. It does not prove real database rows, RLS policies, edge functions or auth.
