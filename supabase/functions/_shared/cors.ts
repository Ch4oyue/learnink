// Shared CORS handling for Edge Functions.
//
// The allowlist comes from the ALLOWED_ORIGINS secret: a comma-separated list of
// exact origins, no wildcards.
//
//   supabase secrets set ALLOWED_ORIGINS="https://learnink.vercel.app,http://localhost:8080"
//
// Behaviour:
//   * An allowlisted Origin is echoed back in Access-Control-Allow-Origin.
//   * Requests without an Origin header (n8n, Zapier, cron, curl, servers) are not
//     subject to CORS and keep working — they simply get no ACAO header, which
//     browsers require only for cross-origin browser calls.
//   * An unlisted Origin gets no ACAO header, so the browser blocks the request.
//   * If ALLOWED_ORIGINS is unset, nothing is allowlisted (fail closed) and the
//     first rejected request logs a configuration error.
//
// Set the secret before deploying: the SPA calls these functions from the browser
// through `supabase.functions.invoke`, which is a cross-origin request.

const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type";
// No function implements PUT or DELETE, so they are not advertised.
const ALLOW_METHODS = "GET, POST, OPTIONS";
const MAX_AGE_SECONDS = "600";

// Scheme and host are case-insensitive, so normalize both sides: a capitalised
// entry in the secret must not silently deny every request.
function normalizeOrigin(value: string): string {
  let origin = value.trim();
  while (origin.endsWith("/")) {
    origin = origin.slice(0, -1);
  }
  return origin.toLowerCase();
}

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map(normalizeOrigin).filter((origin) => origin.length > 0);
}

// Secrets are fixed for the lifetime of the isolate, so read them once.
const ALLOWLIST = parseAllowlist(Deno.env.get("ALLOWED_ORIGINS"));
let hasWarned = false;

function reportRejection(origin: string): void {
  if (hasWarned) return;
  hasWarned = true;

  if (ALLOWLIST.length === 0) {
    console.error(
      "CORS: ALLOWED_ORIGINS is not set, so no browser origin is allowed. " +
        'Set it with: supabase secrets set ALLOWED_ORIGINS="https://your-app.example"',
    );
  } else {
    console.warn(`CORS: rejected origin "${origin}". Allowed: ${ALLOWLIST.join(", ")}`);
  }
}

/** The caller's Origin if it is allowlisted, otherwise null. */
function allowedOrigin(req: Request): string | null {
  const header = req.headers.get("Origin");
  if (!header) return null; // not a browser request; CORS does not apply

  const origin = header.trim();
  if (ALLOWLIST.includes(normalizeOrigin(origin))) {
    // Echo the caller's own value; browsers compare it verbatim.
    return origin;
  }

  reportRejection(origin);
  return null;
}

/**
 * CORS headers for a normal response. Only `Access-Control-Allow-Origin` and
 * `Vary: Origin` have an effect here — the allow-headers/methods/max-age values
 * are only read from the preflight response.
 */
export function corsFor(req: Request): Record<string, string> {
  const origin = allowedOrigin(req);
  const headers: Record<string, string> = { Vary: "Origin" };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * Preflight response. For a disallowed origin it carries no ACAO header, which
 * makes the browser reject the real request.
 */
export function preflight(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsFor(req),
      "Access-Control-Allow-Headers": ALLOW_HEADERS,
      "Access-Control-Allow-Methods": ALLOW_METHODS,
      "Access-Control-Max-Age": MAX_AGE_SECONDS,
    },
  });
}
