import crypto from 'node:crypto';
import type { Page } from '@playwright/test';

// Local-only dummy secret shared with gateway.mjs / PostgREST. Never a real project secret.
const SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
export const API = process.env.REAL_API ?? 'http://127.0.0.1:9000';
const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
export function jwt(payload: Record<string, unknown>) {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const d = b64({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload });
  return `${h}.${d}.${crypto.createHmac('sha256', SECRET).update(`${h}.${d}`).digest('base64url')}`;
}

export const USERS = {
  super: { id: '00000000-0000-0000-0000-000000000001', email: 'super@t.test' },
  admin: { id: '00000000-0000-0000-0000-000000000002', email: 'admin@t.test' },
  tutor: { id: '00000000-0000-0000-0000-000000000003', email: 'tutor@t.test' },
  learner: { id: '00000000-0000-0000-0000-000000000004', email: 'learner@t.test' },
} as const;
export type Who = keyof typeof USERS;

export const tokenFor = (who: Who) => jwt({ sub: USERS[who].id, role: 'authenticated', email: USERS[who].email });
export const serviceToken = () => jwt({ role: 'service_role' });

export async function rest(path: string, init: { method?: string; as?: Who | 'service'; body?: unknown } = {}) {
  const token = init.as === 'service' || !init.as ? serviceToken() : tokenFor(init.as);
  const res = await fetch(`${API}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

export async function resetState() {
  await rest('user_quiz_attempts?id=not.is.null', { method: 'DELETE' });
  await rest('user_progress?id=not.is.null', { method: 'DELETE' });
  await rest('integrations?id=not.is.null', { method: 'DELETE' });
  await rest(`profiles?id=eq.${USERS.learner.id}`, { method: 'PATCH', body: { points: 600, xp: 0, is_premium: false, premium_until: null, display_name: 'Learner' } });
}

/** Signs the browser in as a seeded user with a real signed JWT (the gateway validates it). */
export async function signIn(page: Page, who: Who) {
  const session = {
    access_token: tokenFor(who), refresh_token: 'local-refresh', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: USERS[who].id, email: USERS[who].email, aud: 'authenticated', role: 'authenticated', user_metadata: { display_name: who }, created_at: '2026-01-01T00:00:00Z' },
  };
  await page.addInitScript((s) => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('sb-127-auth-token', JSON.stringify(s));
  }, session);
}
