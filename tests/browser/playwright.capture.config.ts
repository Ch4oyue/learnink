import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Authenticated-page flows against an in-memory Supabase stand-in (see support/app.ts).
// Not a backend test: it proves page behavior against stubbed PostgREST responses.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.capture.ts',
  fullyParallel: true,
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:4176', headless: true },
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: 'bunx vite --host 127.0.0.1 --port 4176',
    url: 'http://127.0.0.1:4176/',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'placeholder-anon-key',
    },
  },
});
