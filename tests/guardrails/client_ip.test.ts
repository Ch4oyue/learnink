// Executed-behavior tests for the edge clientIp() helper.
// The helper is dependency-free TypeScript, so bun runs it directly.
import { describe, expect, test } from "bun:test";
import { clientIp } from "../../supabase/functions/_shared/client-ip.ts";

function req(headers: Record<string, string>): Request {
  return new Request("https://edge.example/fn", { headers });
}

describe("clientIp", () => {
  test("uses the rightmost x-forwarded-for hop (the edge-appended one)", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  test("strips a port suffix from IPv4", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.9:5678" }))).toBe("203.0.113.9");
  });

  test("keeps bracketed IPv6 and drops its port", () => {
    expect(clientIp(req({ "x-forwarded-for": "[2001:db8::1]:443" }))).toBe("2001:db8::1");
  });

  test("malformed empty brackets in x-forwarded-for fall back to unknown", () => {
    expect(clientIp(req({ "x-forwarded-for": "[]" }))).toBe("unknown");
  });

  test("malformed empty brackets in x-real-ip fall back to unknown", () => {
    expect(clientIp(req({ "x-real-ip": "[]" }))).toBe("unknown");
  });

  test("quoted x-real-ip is unquoted and stripped", () => {
    expect(clientIp(req({ "x-real-ip": '"198.51.100.4:9000"' }))).toBe("198.51.100.4");
  });

  test("no usable header returns unknown", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });

  test("empty-string x-real-ip never leaks an empty bucket key", () => {
    expect(clientIp(req({ "x-real-ip": "" }))).toBe("unknown");
  });
});
