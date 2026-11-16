import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir: '.', testMatch: '**/*.browser.ts', fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4175', headless: true },
  webServer: { cwd: fileURLToPath(new URL('../..', import.meta.url)), command: 'bunx vite --host 127.0.0.1 --port 4175', url: 'http://127.0.0.1:4175/tests/browser/fixtures/request-review.html', reuseExistingServer: false },
});
