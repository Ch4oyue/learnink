# Migrating ingest clients off the platform key

Applies to: anything outside this repository that `POST`s to
`https://<project-ref>.supabase.co/functions/v1/ingest-content` (n8n, Make,
Zapier, cron jobs, shell scripts, custom services).

**Status:** the `service_role` key is no longer accepted as an ingest credential.
This document is the migration path for clients that still send it.

---

## 1. What changed

`ingest-content` used to accept three kinds of bearer token. It now accepts two.

| Credential sent as `Authorization: Bearer …` | Before | Now |
| --- | --- | --- |
| Per-integration key `sk_live_…` (from Integration Manager) | ✅ accepted | ✅ **accepted — this is the target** |
| `INGEST_SECRET` shared secret (if configured) | ✅ accepted | ✅ accepted (interim, revocable) |
| Platform key: legacy `service_role` JWT (`eyJ…`) or `sb_secret_…` | ✅ accepted | ❌ **rejected** |

### What a broken client sees

| Situation | Response |
| --- | --- |
| Header absent or not `Bearer …` | `401 {"error":"Missing or invalid Authorization header","success":false}` |
| Platform key sent | `403 {"error":"Unauthorized - Invalid API key","success":false}` |
| Too many attempts from one IP | `429` (limit: 100 requests / 15 min / IP) |

> **Note on the status code:** these clients get **403**, not 401. The request is
> authenticated in the gateway sense but the key is not a valid credential. Each
> rejection also writes an `invalid_api_key` row to `security_logs`, so you can
> find affected clients there rather than by waiting for complaints.

### Why the branch was removed instead of gated

- The platform key cannot be scoped to one integration, attributed to a tenant, or
  revoked without breaking the whole deployment.
- It is the same key Edge Functions use internally, so its blast radius is the
  entire database — it is exactly the credential the rotation in
  [`SECURITY.md` §6](SECURITY.md#6-runbook-rotating-and-purging-the-leaked-service_role-key-c1)
  is trying to retire.
- A compatibility flag would not have saved these clients anyway: revoking the
  legacy JWT secret (§6, step 6) invalidates the key itself.

### Why it used to "just work"

The Supabase gateway accepts any valid JWT in `Authorization`, and a
`service_role` key *is* a JWT signed by the project secret. So the key passed the
gateway check and was then compared literally inside the function. Bearer tokens
from Integration Manager are **not** JWTs, which is why `ingest-content` must be
deployed with `verify_jwt = false` and authenticate itself — that setting is now
declared in [`supabase/config.toml`](../supabase/config.toml).

---

## 2. Who needs to migrate

Search every automation you own for the credential string:

```bash
# In your automation platform, CI, and ops notes — not in this repo.
# A legacy service_role key starts with eyJ and contains "service_role";
# a new one starts with sb_secret_.
grep -rE 'eyJ[A-Za-z0-9_-]{20,}|sb_secret_' ./n8n-workflows ./ops ./terraform
```

In n8n: **Settings → Variables/Environment**, plus any `HTTP Request` node whose
`Authorization` header is hardcoded. In Make/Zapier: HTTP module headers and
connection credentials.

Within this repository, **no client uses the platform key** — verified:

| Caller | Credential used |
| --- | --- |
| `src/lib/workflowTemplates.ts` (n8n Notion + RSS templates) | `Bearer {{ YOUR_API_KEY }}` → `sk_live_…` |
| `src/lib/workflowTemplates.ts` (setup guide) | `LEARNINK_API_KEY=sk_live_xxxxx` |
| `scripts/test_ingest.sh` | `INGEST_API_KEY` (any accepted token) |
| `supabase/functions/generate-api-key/index.ts` | mints the webhook URL only |

So the only affected clients are ones configured outside the repo. Nothing in the
app needs a code change to keep ingesting.

---

## 3. Step 1 — create a per-integration key

The key is shown **once**. Store it in the automation platform's secret store, not
in a workflow export.

**UI:** Dashboard → Integrations (Integration Manager) → *Add Integration*, pick the
source (`n8n`, `notion`, `zapier`, `custom`), then copy the `sk_live_…` value and
the webhook URL immediately.

**API:** `POST /functions/v1/generate-api-key` with an admin's session JWT:

```bash
curl -sS -X POST "https://<project-ref>.supabase.co/functions/v1/generate-api-key" \
  -H "Authorization: Bearer $ADMIN_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"RSS importer","source":"n8n","description":"Hourly RSS sync"}'
```

Response (abridged) — `api_key` appears only here:

```json
{
  "success": true,
  "integration": { "id": "…", "webhook_url": "https://<ref>.supabase.co/functions/v1/ingest-content" },
  "api_key": "sk_live_…",
  "api_key_preview": "sk_live_••••••••a1b2"
}
```

Each integration gets its own key so usage is attributable: the row keeps
`request_count`, `last_used_at`, `api_key_preview`.

## 4. Step 2 — update the client

The request contract is unchanged:

```http
POST /functions/v1/ingest-content
Authorization: Bearer sk_live_…
Content-Type: application/json

{ "title": "Page title", "content": "# Markdown body", "tags": ["notion", "auto-sync"] }
```

Limits: `title` ≤ 200 chars, `content` ≤ 50 KB, `tags` ≤ 10 items of ≤ 50 chars.
Success is `201 {"success":true,"message":"Content received and queued for review","id":"…","source":"n8n"}`.

- **n8n** — in the `HTTP Request` node, set the `Authorization` header to
  `Bearer {{ $env.LEARNINK_API_KEY }}` and set that environment variable to the new
  key (the bundled templates already do this). Keep `LEARNINK_WEBHOOK_URL` as is.
- **curl / cron** —

  ```bash
  curl -sS -X POST "$LEARNINK_WEBHOOK_URL" \
    -H "Authorization: Bearer $LEARNINK_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"title":"Cron import","content":"…","tags":["cron"]}'
  ```
- **Make / Zapier** — replace the credential in the HTTP module's auth header. Do
  not put the key in the request body: body support for `api_key` still exists for
  backward compatibility but is deprecated (request bodies are far more likely to
  be captured by proxy and platform logs).

## 5. Step 3 — verify

```bash
# Expect 201 and a new id
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$LEARNINK_WEBHOOK_URL" \
  -H "Authorization: Bearer $NEW_SK_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Migration smoke test","content":"hello","tags":["migration"]}'
```

Then confirm the row exists and is attributed to the integration:

```sql
SELECT id, title, source, status, integration_id, created_at
FROM public.incoming_contents
ORDER BY created_at DESC
LIMIT 5;
```

`integration_id` must be populated. Rows with `integration_id IS NULL` mean the
request came through the `INGEST_SECRET` path (or was written directly with the
service role) — see [`SECURITY.md` §6 step 7](SECURITY.md#7-check-for-misuse-in-the-exposure-window).

## 6. Step 4 — retire the old credential

1. Confirm the integration's `last_used_at` / `request_count` are moving and no
   `invalid_api_key` events are arriving from that client's IP.
2. Leave the platform key out of every automation from now on. It is being rotated
   and revoked regardless (§6 of the security runbook).
3. If a client is decommissioned, deactivate its integration row
   (`is_active = false`) rather than deleting history.

## 7. Interim option: `INGEST_SECRET`

If you cannot mint per-integration keys yet, the revocable shared secret keeps that
client working while you migrate:

```bash
npx supabase secrets set INGEST_SECRET="$(openssl rand -hex 32)" --project-ref <ref>
```

Then send `Authorization: Bearer <INGEST_SECRET>`. Caveats: it is not attributable
per client (every row is tagged `source: "n8n"`, `integration_id` left NULL), it has
no per-integration rate limit beyond the per-IP limit, and rotating it breaks every
client that shares it simultaneously. Treat it as a bridge, not the destination.

## 8. Rollback

There is no rollback to the platform key — that path is deleted from source, and
the key itself is being revoked. If a client must keep working during an
interruption, use `INGEST_SECRET` (§7). Re-adding a `service_role` acceptance path
is not a supported configuration.

## 9. Checklist

- [ ] Grep automation configs for `eyJ…` / `sb_secret_…` credentials
- [ ] Query `security_logs` for `invalid_api_key` to find clients you missed
- [ ] Create one integration per client (`source` set correctly)
- [ ] Store each `sk_live_…` in the platform's secret store, not the workflow export
- [ ] Update the `Authorization` header; keep the payload shape unchanged
- [ ] Smoke test to 201 and confirm `integration_id` is populated
- [ ] Confirm `request_count` / `last_used_at` advance; no `invalid_api_key` events
- [ ] Remove the platform key from the automation platform entirely
