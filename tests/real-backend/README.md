# Real-backend browser tests

`app.real.ts` drives the real frontend against a real local backend, not the in-memory stand-in used by `tests/browser`:

- Postgres 16 built from `supabase/migrations` (RLS, triggers, RPCs as written in the repo)
- PostgREST with signed JWTs, so row level security is enforced per user
- the real edge functions (`get-users`, `generate-api-key`, `validate-quiz-answers`, `award-xp`) running under Deno
- `gateway.mjs`: thin stand-in for Supabase Auth (`/auth/v1/user`) and the router for `/rest/v1` and `/functions/v1`

It is local only: dummy JWT secret, seeded test users, no network backend, no real keys or accounts.
It proves the code in this repo agrees with itself. It does not prove the live Supabase project matches these migrations.

    tests/real-backend/start.sh                    # prints REAL_ANON_KEY=...
    REAL_ANON_KEY=... bun x playwright test --config tests/real-backend/playwright.real.config.ts

Not covered: real Supabase Auth (login, refresh, OAuth), Storage, Realtime, the AI/Notion/ingest functions, and any drift between the live database and the migrations.
