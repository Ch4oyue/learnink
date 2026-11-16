// Executed-behavior tests for the edge clientIp() helper.
// The helper is dependency-free TypeScript, so bun runs it directly.
import { describe, expect, test } from "bun:test";
import { clientIp } from "../../supabase/functions/_shared/client-ip.ts";

function req(headers: Record<string, string>): Request {
  return new Request("https://edge.example/fn", { headers });
}

const cases: Array<[string, Record<string, string>, string]> = [
  // Rightmost x-forwarded-for hop is the edge-appended one (leftmost is caller-controlled).
  ["uses the rightmost x-forwarded-for hop", { "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.9" }, "203.0.113.9"],
  ["strips a port suffix from IPv4", { "x-forwarded-for": "203.0.113.9:5678" }, "203.0.113.9"],
  ["keeps bracketed IPv6 and drops its port", { "x-forwarded-for": "[2001:db8::1]:443" }, "2001:db8::1"],
  ["malformed empty brackets in x-forwarded-for fall back to unknown", { "x-forwarded-for": "[]" }, "unknown"],
  ["malformed empty brackets in x-real-ip fall back to unknown", { "x-real-ip": "[]" }, "unknown"],
  ["quoted x-real-ip is unquoted and stripped", { "x-real-ip": '"198.51.100.4:9000"' }, "198.51.100.4"],
  ["no usable header returns unknown", {}, "unknown"],
  ["empty-string x-real-ip never leaks an empty bucket key", { "x-real-ip": "" }, "unknown"],
];

describe("clientIp", () => {
  for (const [name, headers, expected] of cases) {
    test(name, () => {
      expect(clientIp(req(headers))).toBe(expected);
    });
  }
});
