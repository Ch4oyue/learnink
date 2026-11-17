import type { Page, Route } from '@playwright/test';

// In-memory PostgREST stand-in for browser tests of authenticated pages.
// No network, no real accounts: every request to the placeholder Supabase host is answered here.
// Rows live in `db`, and writes (PATCH/DELETE/POST) mutate them so tests can assert real state changes.

export const USER_ID = '00000000-0000-4000-8000-000000000001';

export type Row = Record<string, unknown>;
export type Db = Record<string, Row[]>;
export interface AppOptions {
  role?: 'user' | 'tutor' | 'admin' | 'superadmin';
  db?: Db;
  rpc?: Record<string, unknown>;
}

export interface AppHandle {
  db: Db;
  writes: string[];
}

const session = () => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: USER_ID,
    email: 'learner@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: { display_name: 'Test Learner' },
    created_at: '2026-01-01T00:00:00Z',
  },
});

function matches(row: Row, params: URLSearchParams): boolean {
  for (const [key, raw] of params.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue;
    const [op, ...rest] = raw.split('.');
    const val = rest.join('.');
    const cell = row[key];
    if (op === 'eq' && String(cell) !== val) return false;
    if (op === 'neq' && String(cell) === val) return false;
    if (op === 'in') {
      const list = val.replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''));
      if (!list.includes(String(cell))) return false;
    }
    if (op === 'is' && val === 'null' && cell != null) return false;
  }
  return true;
}

export async function installApp(page: Page, opts: AppOptions = {}): Promise<AppHandle> {
  const role = opts.role ?? 'user';
  const db: Db = {
    profiles: [{
      id: USER_ID, display_name: 'Test Learner', avatar_url: null, current_streak: 3, longest_streak: 7,
      last_activity_date: '2026-11-17', points: 120, labels: [], is_premium: false, premium_until: null,
    }],
    user_roles: [{ user_id: USER_ID, role }],
    ...(opts.db ?? {}),
  };
  const writes: string[] = [];

  await page.addInitScript((s) => {
    if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'light');
    localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(s));
  }, session());

  await page.route('**://placeholder.supabase.co/**', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers });
    if (!url.pathname.startsWith('/rest/v1/')) return json({});
    const path = url.pathname.replace('/rest/v1/', '');
    if (path.startsWith('rpc/')) return json(opts.rpc?.[path.slice(4)] ?? 0);
    const rows = db[path] ?? [];
    const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
    const method = req.method();
    if (method === 'PATCH') {
      writes.push(`PATCH ${path}${url.search}`);
      let body: Row = {};
      try { body = JSON.parse(req.postData() ?? '{}'); } catch { /* empty */ }
      db[path] = rows.map((r) => (matches(r, url.searchParams) ? { ...r, ...body } : r));
      return route.fulfill({ status: 204, body: '' });
    }
    if (method === 'DELETE') {
      writes.push(`DELETE ${path}${url.search}`);
      db[path] = rows.filter((r) => !matches(r, url.searchParams));
      return route.fulfill({ status: 204, body: '' });
    }
    if (method === 'POST') {
      writes.push(`POST ${path}`);
      let body: Row | Row[] = {};
      try { body = JSON.parse(req.postData() ?? '{}'); } catch { /* empty */ }
      const added = (Array.isArray(body) ? body : [body]).map((r, i) => ({ id: `new-${rows.length + i}`, ...r }));
      db[path] = [...rows, ...added];
      return json(wantsObject ? added[0] : added, 201);
    }
    const filtered = rows.filter((r) => matches(r, url.searchParams));
    if (method === 'HEAD' || (req.headers()['prefer'] ?? '').includes('count=exact')) {
      return json(method === 'HEAD' ? [] : filtered, 200, { 'content-range': `0-${Math.max(filtered.length - 1, 0)}/${filtered.length}` });
    }
    return json(wantsObject ? (filtered[0] ?? null) : filtered);
  });

  return { db, writes };
}

export const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'));
