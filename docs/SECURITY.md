# Security Review — LearnInk

Date: 2026-11-15
Scope: frontend (`src/`), Supabase Edge Functions (`supabase/functions/`), schema/RLS history (`supabase/migrations/`), repository configuration.

This document records what was found, what was fixed, and what still needs a
human decision. Items marked **Action required** cannot be fixed from source code
alone.

---

## 1. Critical

### C1. `service_role` key committed to the repository — FIXED (rotation still required)

`.env.example` contained a real Supabase `anon` key **and a real `service_role`
JWT**. A `service_role` key bypasses every Row Level Security policy, so anyone
with read access to this repository (or to its history, or to a clone on a
laptop, or to a CI log) had full read/write access to the database.

* Fixed: `.env.example` now contains placeholders only.
* **Action required — see [§6 Runbook](#6-runbook-rotating-and-purging-the-leaked-service_role-key-c1).** The key is still valid until the JWT secret is rotated, and it is still readable in Git history. Rotation is what removes the risk; history cleanup only removes the exposure.

### C2. Hardcoded super-admin backdoor — FIXED

`supabase/functions/generate-api-key/index.ts` granted admin access to a
hardcoded email address **and** a hardcoded user UUID:

```ts
const SUPER_ADMIN_EMAIL = 'agen.salva@gmail.com';
const SUPER_ADMIN_ID = '676c1aca-...';
const isHardcodedSuperAdmin = user.email === SUPER_ADMIN_EMAIL || user.id === SUPER_ADMIN_ID;
```

This is a permanent, undeletable privilege grant in source: it survives removal
of the `user_roles` row, and it leaks a personal email address plus an account
identifier to every reader of the repository.

* Fixed: authorization now comes only from `user_roles` via the shared
  `getUserRoles` helper.

---

## 2. High

### H1. `generate-module` had no authorization check — FIXED

`verify_jwt = true` only proves the caller is *some* signed-in user. The function
then used the service-role client to insert `modules`, update
`material_requests` and insert `notifications`, so any registered learner could
create published modules and spend AI credits.

* Fixed: requires `tutor` / `admin` / `superadmin` (`STAFF_ROLES`).

### H2. `summarize-request` was reachable by any signed-in user — FIXED

Same root cause; the endpoint spends Gemini quota for arbitrary input.

* Fixed: requires `STAFF_ROLES`.

### H3. `sync-notion-page` accepted caller input with service-role writes — FIXED

Any authenticated user could post `{ pageId, notionApiKey }` and cause
`incoming_contents` rows to be created or updated with the service role.

* Fixed: admin-only, and `pageId` is now validated against a hex/UUID pattern
  because it is interpolated into the Notion API URL.
* Still worth doing: store the Notion token server-side (Supabase secret) rather
  than accepting it from the browser on every call.

### H4. `ingest-content` accepted the `service_role` key as an API key — FIXED

```ts
if (token === SUPABASE_SERVICE_ROLE_KEY) { return { id: "service-role", ... } }
```

Any caller holding the platform key could post content indefinitely, and that key
can never be scoped, rate-limited per tenant, or revoked without breaking the
whole platform. The branch was deleted outright (no compatibility flag — a flag
is just a switch someone can flip back). `ingest-content` now accepts only a
per-integration `sk_live_…` key from `generate-api-key`, or the revocable legacy
`INGEST_SECRET` shared secret.

**External clients that send the platform key now get `403`.** No client in this
repository does — the n8n templates and `scripts/test_ingest.sh` already use
`sk_live_…` / `INGEST_API_KEY` — so the only affected callers are automations
configured outside the repo. Migration steps, including how to find them in
`security_logs`: [`INGEST_CLIENT_MIGRATION.md`](INGEST_CLIENT_MIGRATION.md).
`supabase/config.toml` now pins `[functions.ingest-content] verify_jwt = false`,
because those bearer tokens are not JWTs and the gateway would otherwise reject
them with a `401` before the function ever validates them.

### H5. Secrets in security logs — FIXED

Failed ingest attempts logged `token.substring(0, 10)`. Token fragments do not
belong in `security_logs`; the field was removed.

---

## 3. Medium

Remaining open items in the table; M1 and M3 were fixed after the review and are
documented below it.

| ID | Finding | Recommendation |
| --- | --- | --- |
| M2 | Client-side role checks (`RoleProtectedRoute`, `isAdmin` in `AuthContext`, guards in `useUserRole`) are UX only. `useUpdateUserRole` "protects" the super admin in the browser. | Fine as UX; make sure the RLS/trigger layer is the actual control (see `20260208000000_fix_privilege_escalation.sql`). Never treat a client guard as a security boundary. |
| M4 | Rate limiting fails open (`return true` when the RPC errors), so a database blip disables the limiter on AI-spending endpoints. | Consider failing closed for `/generate-module` and `/generate-quiz`. |
| M5 | `ingest-content` accepts the API key in the request body as well as the header. Bodies are more likely to be logged by proxies. | Deprecate the body form; header only. |
| M6 | `supabase/functions/*` are excluded from `tsc`, so type errors there are only caught at deploy time. | **Partly fixed:** `.github/workflows/ci.yml` now has a `deno-check` job. It pins the current per-function error counts (5 functions, 25 errors) and fails if any count grows, so no new type error can merge. Clearing the baseline needs the type regeneration below. |

### M1 (wildcard CORS) — FIXED

All nine functions returned `Access-Control-Allow-Origin: *`. Not directly
exploitable — authorization is a bearer header, not a cookie — but it let any
website call the endpoints with a token it had obtained.

They now share `supabase/functions/_shared/cors.ts`, driven by the
`ALLOWED_ORIGINS` secret (comma-separated, exact origins, no wildcards):

- allowlisted `Origin` → echoed in `Access-Control-Allow-Origin`, with `Vary: Origin`
- no `Origin` header (n8n, Zapier, cron, curl, servers) → no ACAO header, and none is
  needed: those clients are not subject to CORS, so `ingest-content` automation is
  unaffected
- unlisted `Origin` → no ACAO header, so the browser blocks the request
- unset `ALLOWED_ORIGINS` → nothing is allowlisted (fail closed) and the first
  rejection logs a configuration error

**Set the secret before deploying the functions**, otherwise the SPA's
`supabase.functions.invoke` calls (admin users, XP rewards, module generation) are
blocked:

```bash
npx supabase secrets set ALLOWED_ORIGINS="https://learnink.vercel.app,http://localhost:8080" \
  --project-ref <PROJECT_REF>
```

Vercel preview deployments get a unique origin per deployment, so a preview's admin
pages need that origin added to the secret (or must go through the production
domain).

---

### M3 (hardcoded super-admin identity) — FIXED

`src/hooks/useUsers.ts` exported `SUPER_ADMIN_EMAIL` (`agen.salva@gmail.com`) and
`SUPER_ADMIN_USER_ID`, and `AuthContext`, `useUserRole` and `DashboardUsers` used
them to decide who is a super admin. That put a real admin email address and
account UUID in the JS bundle served to every visitor, and let the UI disagree
with what `user_roles` actually says.

Super-admin status is now derived from `user_roles` only:

- **`AuthContext`** — role is `user_roles.role`, defaulting to `user`; the email/id
  fallback is gone and `fetchAuthData` no longer takes an email argument.
- **`useUpdateUserRole` / `useBanUser`** — protection is a `user_roles` lookup on the
  target user, so a super admin cannot be demoted or banned by identity guesswork.
- **`DashboardUsers`** — the "Super Admin" badge and the label controls key off
  `role === 'superadmin'` (current user's role from `useAuth()`).
- The now-unused `isSuperAdmin()` helpers in `useUsers.ts` and `useUserRole.ts`
  were deleted; both performed the email/id comparison.

Verified after a production build: `grep -R "agen.salva\|676c1aca" dist/` returns
no matches.

> Still open: three migrations (`20260120070000_protect_super_admin.sql`,
> `20260124130000_add_superadmin_role.sql`,
> `20260125000000_fix_superadmin_protection.sql`) hardcode the same email inside
> SQL triggers. That is server-side and never reaches the browser, but it should be
> replaced by a role-based check in a follow-up migration so the account can be
> renamed without losing protection.

## 4. Correctness bug found during the review — FIXED

`supabase/functions/award-xp/index.ts` referenced an undefined identifier
`updateData` after the atomic claim update. Any claim would have thrown a
`ReferenceError` and returned HTTP 400 *after* marking the reward as claimed,
permanently losing the user's reward. The dead branch was removed; the real
race-condition guard (`updatedRows.length === 0`) is unchanged.

---

## 5. Structural changes made

* `src/lib/changelogParser.test.ts` → `tests/unit/lib/changelogUtils.test.ts`.
  It was a test living in `src/` (so it shipped to the type-check graph and was
  not run by the `tests/` layout) and it tested `changelogUtils`, not
  `changelogParser`.
* `supabase/create_missing_tables.sql`, `supabase/fix_rls_performance.sql` and
  `scripts/fix_all_rpc_and_roles.sql` → `supabase/archive/` with a README. Loose
  SQL at the migrations root is not applied by `supabase db push` and drifts from
  the real schema; migrations must be the single source of truth.
* `verification/` → `docs/verification/` (screenshots and a one-off script).
* `test-results/` and `supabase/.temp/` are no longer tracked, and both are now
  in `.gitignore` along with `playwright-report/`, `coverage/` and
  `supabase/.branches/`.
* New `supabase/functions/_shared/auth.ts` centralises JWT verification and role
  lookup so every privileged function enforces authorization the same way.

---

## 6. Runbook: rotating and purging the leaked `service_role` key (C1)

Owner-only. Requires Supabase Dashboard access, the Vercel project, and
force-push rights on `github.com/Ch4oyue/learnink`. Budget ~2 hours plus a
re-clone by every contributor. **Rotation (steps 1–7) is the security fix;
history purging (step 9) is cleanup and must not be attempted first.**

### TL;DR — the six actions, in order

| # | Action | Where |
| --- | --- | --- |
| 1 | Confirm the leaked key is still live against each candidate project | `curl` (step 1) |
| 2 | Create replacement publishable + secret keys | Dashboard → **Settings → API Keys** → *Publishable and secret API keys* |
| 3 | Update Vercel env (Production **and** Preview), Edge Function secrets, then **redeploy** the frontend | Vercel / `supabase secrets set` (step 3) |
| 4 | Deactivate the legacy `anon` + `service_role`, then revoke the legacy JWT secret | Dashboard → **Settings → API Keys** (legacy), then **Settings → JWT Keys** (steps 5–6) |
| 5 | Review `security_logs` and the dashboard request logs for the exposure window | SQL editor as `postgres` (step 7) |
| 6 | Purge the key from Git history and force-push | `git filter-repo` on a mirror (step 9) |

**The two legacy keys can only be disabled together.** Supabase's Dashboard
exposes one control for the pair — there is no way to retire the leaked
`service_role` while leaving `anon` enabled. That is why step 3 (move the frontend
to the publishable key and redeploy) has to be finished first: until it is, the
only thing standing between the leaked key and the database is luck.

Supabase is deprecating the legacy `anon`/`service_role` keys by the end of 2026,
so this migration has to happen regardless — the leak only changes the deadline.

The *JWT secret* is a separate step, not an alternative: revoking it invalidates
every existing user session, and Supabase blocks it until both legacy keys are
disabled. Do both, in that order.

### Where exactly to click

| What you are changing | Dashboard path |
| --- | --- |
| The leaked legacy `anon` / `service_role` JWT pair | **Settings → API Keys** → *Legacy API keys* → deactivate (one control for the pair) |
| The replacements (`sb_publishable_…`, `sb_secret_…`) | **Settings → API Keys** → *Publishable and secret API keys* → **Create new API keys** |
| The signing secret every access token depends on | **Settings → JWT Keys** → **Revoke legacy JWT secret** |
| What the deployed functions actually see | **Settings → Edge Functions → Secrets** (names only; `supabase secrets list` shows the same) |
| Proof of use | **Logs → API**, **Logs → PostgREST**, **Logs → Auth** |

### 0. Facts already established for this repository

| Fact | Value |
| --- | --- |
| Exposure | `.env.example` committed a live `anon` **and** `service_role` JWT |
| Commits involved | `608205d`, `01738b1` (`git log -S service_role -- .env.example`) |
| Project the key belongs to | the JWT `ref` claim is `jrjbfuifcpziafnvugos` |
| Project the CLI is linked to | `imkghltdscefumdmbrld` (`supabase/.temp/project-ref`) |
| Token lifetime | long-lived (`exp` ≈ 2035), so it stays valid until the secret is revoked |
| Fixed in working tree | yes — `.env.example` has placeholders, `grep -c eyJ .env.example` = 0 |

> **The two project refs differ.** The leaked key is for
> `jrjbfuifcpziafnvugos`, while the CLI link points at
> `imkghltdscefumdmbrld`. Treat **both** projects as compromised until you have
> confirmed which deployment the committed key actually works against — a stale
> project is still a live database. Verify with step 1.

### 1. Identify every project the old key still opens

Do not trust the `ref` claim alone: keys can be pasted into the wrong project's
file. For each candidate project, run this **before** rotating (the response
`200` vs `401` tells you whether the key is live there). Use the leaked
`service_role` value, held only in an untracked file:

```bash
# Extract the leaked JWTs from history into a gitignored file — do not paste
# them into chat, an issue, a commit message or this document.
git log -p --all -- .env.example \
  | grep -oE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' \
  | sort -u > /tmp/leaked.txt
wc -l /tmp/leaked.txt   # expect 2: one anon, one service_role

# Decode the payloads to see role + project ref of each key
python3 - <<'PY'
import base64, json
for line in open('/tmp/leaked.txt'):
    p = line.strip().split('.')[1]
    p += '=' * (-len(p) % 4)
    d = json.loads(base64.urlsafe_b64decode(p))
    print(d.get('role'), d.get('ref'))
PY
```

```bash
# Per candidate project: is the service_role key still accepted?
# 200 => still live there, rotate that project too. 401 => already dead.
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://<PROJECT_REF>.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $LEAKED_SERVICE_ROLE" \
  -H "Authorization: Bearer $LEAKED_SERVICE_ROLE"
```

Note: a `service_role` request that succeeds proves full RLS bypass — it can
read every table. Expect to find the key live on `jrjbfuifcpziafnvugos`.

### 2. Create the replacement keys (no downtime yet)

Legacy `anon` / `service_role` can no longer be rotated in place; Supabase's
guidance is to move to asymmetric JWT signing keys plus publishable/secret API
keys, then retire the legacy pair.

1. Dashboard → **Settings → API Keys** → *Publishable and secret API keys* tab →
   **Create new API keys**. Note the `sb_publishable_…` and `sb_secret_…` values.
   This does **not** revoke anything; both systems work side by side.
2. Dashboard → **Settings → JWT Keys** → **JWT Signing Keys** tab → if offered,
   **Migrate JWT secret**, then **Rotate Keys** (the current key moves to
   "Previously used keys"; new tokens are signed with the new private key, and
   existing `anon`/`service_role` JWTs and live user sessions stay valid). A
   rotated-but-not-revoked key is still trusted — step 6 is the revoke.
3. Keep the legacy pair **enabled** until step 4 is deployed everywhere.

### 3. Update every consumer of the old values

| Variable | Where it lives in this repo/deploy | Change |
| --- | --- | --- |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | local `.env`, **Vercel** env (Production *and* Preview), any other static host | legacy `anon` JWT → `sb_publishable_…` |
| `SUPABASE_ANON_KEY` | Edge Function secret / platform-injected | → `sb_publishable_…` |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function secret / platform-injected | `service_role` JWT → `sb_secret_…` |
| `SUPABASE_URL` | unchanged | no change |
| `INGEST_SECRET` | Edge Function secret (`ingest-content`) | rotate independently: `openssl rand -hex 32` |
| `LOVABLE_API_KEY`, `GEMINI_API_KEY` | Edge Function secrets | unaffected |

Procedure:

```bash
# What is actually set on the project right now (names only, never values)
npx supabase secrets list --project-ref <PROJECT_REF>

# Replace the two that matter; do not echo the values into logs or shell history
npx supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="sb_secret_…" \
  SUPABASE_ANON_KEY="sb_publishable_…" \
  --project-ref <PROJECT_REF>

# INGEST_SECRET rotation (announce it to whoever runs the n8n workflow first)
npx supabase secrets set INGEST_SECRET="$(openssl rand -hex 32)" --project-ref <PROJECT_REF>
```

`supabase/functions/_shared/auth.ts`, `client.ts` and the rest of the codebase
read these names as-is — no source change is required.

**Vite inlines `VITE_*` at build time.** Updating the Vercel env var does
nothing until you **redeploy** the frontend. A restart is not enough.

**CI secrets: none to change.** `.github/workflows/{ci,codeql,dependency-review,
sonarqube,auto-release}.yml` reference only `GITHUB_TOKEN`, `SONAR_TOKEN` and
`SONAR_HOST_URL`. No Supabase key is stored in GitHub Actions, so there is
nothing to rotate there — and keep it that way: the publishable key may go in
repo *variables* if CI ever builds the frontend, never a secret key.

The only other consumer is local tooling: `scripts/benchmark_auth.js` reads
`SUPABASE_SERVICE_ROLE_KEY` from the environment. Point it at the new secret
key, keep it out of CI, and use a disposable test user.

### 4. Deploy and verify with both key sets alive

```bash
npx supabase functions deploy --project-ref <PROJECT_REF>   # all functions
# or deploy individually: ingest-content, generate-api-key, generate-module,
# generate-quiz, validate-quiz-answers, award-xp, get-users, summarize-request,
# sync-notion-page
```

Smoke-test before retiring anything (new key must work, old must still work so
rollback is possible):

- sign in as a normal user → dashboard loads, module list loads
- `POST /functions/v1/ingest-content` with an `sk_live_…` integration key → 201
- `get-users` as an admin → 200; as a learner → 403 (H1–H3 behaviour intact)
- `award-xp` on a completed module → 200 with `xp_gained` (the deleted-`updateData` bug)
- Edge Function logs show no `SUPABASE_ANON_KEY is not set` / 401 noise

### 5. Disable the legacy keys

Dashboard → **Settings → API Keys** → legacy section → **deactivate** the legacy
`anon` and `service_role` keys.

Order matters: revoking the legacy JWT secret is **blocked** until both legacy
keys are disabled. Re-enabling them later would restore the compromised key, so
treat this as one-way.

Re-run step 1's `curl` — it must now return `401`.

### 6. Revoke the legacy JWT secret

Dashboard → **Settings → JWT Keys** → **JWT Signing Keys** tab → three-dot menu
on the previously used key → **Revoke**. (Not revoking leaves the old key valid.)
Supabase refuses this until both legacy API keys are disabled, so step 5 must
actually have completed — a half-done step 5 blocks step 6.

**This signs every user out.** All existing access/refresh tokens were signed
with the old secret and are rejected immediately. Coordinate it:

- pick a low-traffic window and announce it
- expect a burst of re-authentication; nothing in this app stores session state
  in `localStorage` that survives a 401 (`client.ts` persists only the Supabase
  session token, which becomes invalid)
- users with unsaved work in `ModuleLearn` lose in-flight progress unless
  `useOfflineSync`'s `pending_progress_syncs` queue has flushed

Verify: fresh sign-in works, and a token minted before revocation returns 401.

### 7. Check for misuse in the exposure window

Run these in the Supabase SQL editor as `postgres` (bypasses RLS; the
`security_logs_admin_select` policy only allows admins to read). Adjust the
lower bound to the date of the **earliest** leaking commit, `01738b1`
(`2026-02-01T13:18:29Z`; `608205d` is the second one). Derive it rather than
trusting this page:

```bash
# Oldest commit that touched the file = start of the exposure window.
git log --all --reverse --format='%h %cI' -- .env.example | head -3
# Narrow to commits whose diff changed how often `service_role` appears.
# (Hint only: pickaxe misses edits that keep the occurrence count identical,
# so trust the file history above, not this.)
git log --all --reverse --format='%h %cI' -S'service_role' -- .env.example | head -3
```

```sql
-- a. Failed / blocked attempts: a brute-force or bot sweep looks like a spike
SELECT date_trunc('hour', created_at) AS hour,
       event_type, ip_address, count(*) AS hits
FROM public.security_logs
WHERE created_at >= '2026-02-01'
  AND event_type IN ('invalid_api_key','auth_failure','rate_limit_exceeded',
                     'unauthorized_access','suspicious_activity')
GROUP BY 1, 2, 3
ORDER BY hits DESC
LIMIT 50;

-- b. Content ingested without a per-integration key.
--    The legacy service-role path skips integration_id, so does a direct
--    PostgREST write. Anything here that you cannot attribute is suspicious.
SELECT id, title, source, status, integration_id, created_at
FROM public.incoming_contents
WHERE integration_id IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- c. Integrations minted by someone else (an attacker can create a durable
--    sk_live_ key via generate-api-key and keep access after rotation)
SELECT id, name, source, api_key_preview, created_by, is_active,
       request_count, last_used_at, created_at
FROM public.integrations
ORDER BY created_at DESC;

-- d. Privilege changes
SELECT ur.user_id, ur.role, u.created_at AS account_created, u.email
FROM public.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'superadmin')
ORDER BY ur.user_id;

-- e. Economy tampering — thresholds are illustrative, compare to your own
--    distribution before drawing conclusions
SELECT id, display_name, xp, points, is_premium, premium_until, created_at
FROM public.profiles
WHERE points > 10000 OR xp > 100000
ORDER BY points DESC
LIMIT 50;

-- f. Modules created outside the review flow
SELECT id, title, is_published, source_request_id, generated_at, created_at
FROM public.modules
ORDER BY created_at DESC
LIMIT 50;
```

Also check, outside SQL:

- **Dashboard → Logs → API / PostgREST / Auth**: request counts and status codes
  in the exposure window. This is the only place that shows *successful*
  `service_role` traffic.
- **Dashboard → Auth → Users**: accounts you do not recognise, or unexpected
  email/password changes on admin accounts.
- **Storage**: unexpected objects (the key also grants Storage access).

> **A `service_role` key can also write to this table.** `log_security_event` is
> executable by `service_role`, and the key bypasses RLS on `security_logs`
> itself, so anyone who held it could delete rows or forge entries. Treat the log
> as corroborating evidence, never as proof that nothing happened.

> **Caveat that decides how much you trust the logs.** A `service_role` key
> grants raw PostgREST, Storage and direct database access. Those requests never
> pass through an Edge Function, so they never reach `log_security_event` and
> **never appear in `security_logs`**. An empty `security_logs` result means "the
> leak was not exercised through our ingestion endpoint", not "the key was never
> used". The authoritative evidence is the data itself (queries a–f) plus the
> dashboard request logs. Because the token's `exp` is ~2035, assume it was valid
> for the entire window.

If (b), (c) or (d) return anything you cannot attribute: deactivate the affected
integrations (this invalidates their `sk_live_` keys), force a password reset on
unrecognised admin accounts, and re-run (e)/(f) after cleanup.

### 8. Rotate the legacy ingest secret

`INGEST_SECRET` is a shared static secret accepted by `ingest-content`. Rotate it
in step 3 and update the n8n workflow that sends it. Confirm no automation sends
the platform key (`service_role` / `sb_secret_…`) to `ingest-content`: it is no
longer accepted as an ingest token, and it would stop working at step 6 anyway.
Find stragglers via `security_logs` (`invalid_api_key`) and move each one to a
per-integration key — see [`INGEST_CLIENT_MIGRATION.md`](INGEST_CLIENT_MIGRATION.md).

### 9. Purge the key from Git history

Only after steps 4–5 are verified. Rewriting history is destructive and requires
coordination: **every contributor must re-clone, not `git pull`**, open PRs
break, and forks keep their own copy of the blob.

Prerequisites: `pip install git-filter-repo` (or `brew install git-filter-repo`);
it is not shipped with Git. Note also that `refs/pull/*` on GitHub is a separate
namespace that `git push --force --all` never rewrites — every closed or open PR
that touched the key still renders the old blob at
`https://github.com/Ch4oyue/learnink/pull/<n>`, including the open PR #11. Only
GitHub Support can purge those refs, which is why step 5 of the post-push list
is not optional.

```bash
# 0. Back up the whole repository first (mirror = all refs)
git clone --mirror https://github.com/Ch4oyue/learnink.git /tmp/learnink-backup.git

# 1. Work on a fresh mirror, not on a working copy
cd /tmp && git clone --mirror https://github.com/Ch4oyue/learnink.git learnink-clean.git
cd learnink-clean.git

# 2. Build the redaction list from the leaked values (already in /tmp/leaked.txt)
: > /tmp/redactions.txt
while read -r key; do
  printf '%s==>***REMOVED-ROTATED-KEY***\n' "$key" >> /tmp/redactions.txt
done < /tmp/leaked.txt

# 3. Rewrite every commit that ever contained those strings
#    (git-filter-repo: https://github.com/newren/git-filter-repo)
git filter-repo --replace-text /tmp/redactions.txt --force

# 4. Verify: zero occurrences anywhere in history
git log -p --all -- .env.example | grep -c 'eyJ' || echo 'clean: 0 hits'

# 5. Push the rewritten history (force, all branches)
git remote add origin https://github.com/Ch4oyue/learnink.git
git push --force --all origin
git push --force --tags origin
# optional, to also delete remote branches that no longer exist:
# git push --force --mirror origin

# 6. Confirm the live branch is clean
git clone --depth 1 https://github.com/Ch4oyue/learnink.git /tmp/verify-clone \
  && grep -c 'eyJ' /tmp/verify-clone/.env.example || echo 'clean: 0 hits'
```

Post-push cleanup, in order:

1. **Tell GitHub Support** (or use the repo's sensitive-data removal request) so
   cached views, `refs/pull/*` and the commit API stop serving the old blob.
   Force-pushing does not by itself expire cached objects, and PR pages still
   render the pre-rewrite diff. Verify afterwards that the old blob 404s:
   `curl -s -o /dev/null -w '%{http_code}\n' https://raw.githubusercontent.com/Ch4oyue/learnink/01738b1/.env.example`
   (a `200` that still contains a JWT means Support has not purged it yet).
2. Ask owners of forks to delete and re-fork; a fork retains the original objects.
3. Contributors: delete their clone and re-clone. `git pull` after a rewrite
   reintroduces the old commits and can resurrect the key.
4. This chat's branch `freebuff/fc088cadcf54656e8ef38487` and
   `freebuff-base` are based on the pre-rewrite history and will be orphaned by
   step 5. Land or discard any outstanding work first, then start a fresh chat
   from the rewritten `main`.
5. Re-check that `.env.example` in the rewritten `main` still contains
   placeholders only.

If the repository is public and was indexed (forks, mirrors, archive services),
assume copies exist. That is precisely why rotation, not rewriting, is the fix.

### 10. Prevent recurrence — IMPLEMENTED

- **CI gate:** `.github/workflows/ci.yml` has a `secret-scan` job running
  `gitleaks/gitleaks-action@v2` on every push and pull request to `main`. It scans
  only the commits in that event, so the keys already in history (this section's
  root cause) do not fail every run. A `GITLEAKS_LICENSE` is needed for
  organization-owned repos only; this repository is a personal account.
- **Pre-commit hook:** `.githooks/pre-commit` runs `gitleaks git --staged`
  (`protect --staged` on ≤8.18) and aborts the commit on a finding. `bun install`
  enables it through the `prepare` script (`git config core.hooksPath .githooks`);
  do the same manually in an existing clone. With no `gitleaks` on `PATH` it
  prints an install hint and skips — CI remains the enforcement point.
- GitHub secret scanning and push protection are already enabled on this
  repository; keep them on.
- Keep `.env.example` placeholder-only; the `.gitignore` entry `!.env.example`
  exists so it stays reviewable — review it on every PR that touches it.
- Upgrade the action from the `@v2` tag to a pinned commit SHA.

### Rollback

Between steps 2 and 5 both key systems are live, so rolling back the *deployment*
is just redeploying the previous build. Rollback stops being available at step 6
(legacy JWT secret revoked) — after that, recovery means creating new keys, not
re-enabling the old ones, because re-enabling restores the compromised value.

### Checklist

- [ ] Step 1: leaked key tested against both project refs, live one identified
- [ ] Step 2: `sb_publishable_…` + `sb_secret_…` created, JWT keys migrated/rotated
- [ ] Step 3: Vercel env updated **and redeployed**; Edge Function secrets updated
- [ ] Step 3: `INGEST_SECRET` rotated and n8n updated
- [ ] Step 4: all 9 functions deployed; learner/admin smoke tests pass
- [ ] Step 5: legacy `anon` + `service_role` deactivated; old key returns 401
- [ ] Step 6: legacy JWT secret revoked; users re-authenticated; window announced
- [ ] Step 7: queries a–f reviewed, dashboard logs reviewed, findings recorded here
- [ ] Step 7: remember a key-holder could have edited `security_logs` itself, so
      "no rows" is not "no access"
- [ ] Step 8: no automation sends the platform key to `ingest-content`
- [ ] Step 8: every external ingest client moved to its own `sk_live_…` key
      ([migration guide](INGEST_CLIENT_MIGRATION.md))
- [ ] Step 9: history rewritten, force-pushed, contributors re-cloned
- [ ] Step 9: GitHub Support asked to purge cached blobs **and `refs/pull/*`**;
      the `raw.githubusercontent.com` URL for `01738b1` no longer serves a JWT
- [ ] Step 10: secret scanning enabled on `main`
