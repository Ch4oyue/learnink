import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Frontend against a REAL local backend: Postgres built from supabase/migrations, PostgREST with RLS,
// and the actual edge functions under Deno (see README.md and start.sh). Not production, not Supabase cloud.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.real.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:4177', headless: true },
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: 'bunx vite --host 127.0.0.1 --port 4177',
    url: 'http://127.0.0.1:4177/',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: process.env.REAL_API ?? 'http://127.0.0.1:9000',
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.REAL_ANON_KEY ?? '',
    },
  },
});
