// Client IP for rate limiting and the security audit trail.
//
// `x-forwarded-for` is a comma-separated chain that the *caller* can prepend to:
// proxies append the address they saw to the right, so the leftmost entry is
// whatever the client claimed. Reading `split(",")[0]` therefore handed the
// caller control of its own rate-limit bucket (a random value per request =
// unlimited requests) and of `security_logs.ip_address` (a poisoned audit trail).
// The rightmost entry is the one the edge appended last.
//
// Values can arrive quoted, bracketed, or with a port (`1.2.3.4:5678`,
// `[2001:db8::1]:443`); `security_logs.ip_address` is an INET column, so those
// are normalised here rather than failing the insert.

function stripQuotes(value: string): string {
  let result = value.trim();
  while (result.startsWith("\"") || result.startsWith("'")) {
    result = result.slice(1);
  }
  while (result.endsWith("\"") || result.endsWith("'")) {
    result = result.slice(0, -1);
  }
  return result.trim();
}

/** Drops a `:port` suffix, leaving IPv6 (multiple colons) untouched. */
function stripPort(value: string): string {
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end > 0 ? value.slice(1, end) : value;
  }

  const colon = value.lastIndexOf(":");
  if (colon > 0 && value.indexOf(":") === colon) {
    const port = value.slice(colon + 1);
    if (port.length > 0 && [...port].every((char) => char >= "0" && char <= "9")) {
      return value.slice(0, colon);
    }
  }

  return value;
}

/**
 * The address of the hop that reached us: the rightmost `x-forwarded-for`
 * entry, falling back to `x-real-ip`. Returns "unknown" when neither is usable,
 * which the rate limiter treats as a single shared bucket.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map(stripQuotes).filter((hop) => hop.length > 0);
    if (hops.length > 0) {
      // stripPort can yield "" for a malformed bracketed value like "[]".
      return stripPort(hops[hops.length - 1]) || "unknown";
    }
  }

  const realIp = req.headers.get("x-real-ip");
  return realIp ? stripPort(stripQuotes(realIp)) || "unknown" : "unknown";
}
