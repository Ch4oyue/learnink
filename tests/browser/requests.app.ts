import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const req = (id: string, type: string, topic: string, status: string, category = 'General') => ({
  id, user_id: USER_ID, topic, description: `${topic} description`, status, assigned_to: null, admin_notes: null,
  created_at: ago(3600e3), updated_at: ago(3600e3), category, priority: 'medium', ai_summary: null, type, image_url: null,
});
const rows = () => [
  req('r1', 'module', 'Python Basics', 'pending'),
  req('r2', 'module', 'Rust Ownership', 'completed'),
  req('r3', 'feature', 'Dark mode scheduling', 'reviewing'),
  req('r4', 'bug', 'Quiz timer resets', 'pending'),
];

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('requests: tabs, search and status filter narrow the list', async ({ page }) => {
      await installApp(page, { role: 'admin', db: { material_requests: rows() } });
      await page.goto('/dashboard/requests');
      await expect(page.getByText('Python Basics', { exact: true })).toBeVisible();
      await expect(page.getByText('Rust Ownership', { exact: true })).toBeVisible();
      await expect(page.getByText('Dark mode scheduling', { exact: true })).toHaveCount(0);

      await page.getByPlaceholder(/search material/i).fill('rust');
      await expect(page.getByText('Rust Ownership', { exact: true })).toBeVisible();
      await expect(page.getByText('Python Basics', { exact: true })).toHaveCount(0);
      await page.getByPlaceholder(/search material/i).fill('');

      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Completed' }).click();
      await expect(page.getByText('Rust Ownership', { exact: true })).toBeVisible();
      await expect(page.getByText('Python Basics', { exact: true })).toHaveCount(0);
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'All Status' }).click();

      await page.getByRole('tab', { name: /Feature/ }).click();
      await expect(page.getByText('Dark mode scheduling', { exact: true })).toBeVisible();
      await expect(page.getByText('Python Basics', { exact: true })).toHaveCount(0);
      await page.getByRole('tab', { name: /Bug/ }).click();
      await expect(page.getByText('Quiz timer resets', { exact: true })).toBeVisible();
    });

    test('requests: create dialog posts the typed values and the list refreshes', async ({ page }) => {
      const app = await installApp(page, { role: 'user', db: { material_requests: rows() } });
      await page.goto('/dashboard/requests');
      await page.getByRole('button', { name: /create new request/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel(/topic|title/i).first().fill('Go Concurrency');
      await dialog.getByLabel('Category').fill('Programming');
      await dialog.getByLabel(/^Description/).fill('Goroutines and channels');
      await dialog.getByRole('button', { name: /submit|create|send/i }).last().click();
      await expect.poll(() => app.writes.some((w) => w === 'POST material_requests')).toBe(true);
      const created = app.db.material_requests.find((r) => r.topic === 'Go Concurrency');
      expect(created).toMatchObject({ user_id: USER_ID, category: 'Programming', description: 'Goroutines and channels', type: 'module', priority: 'medium' });
      await expect(dialog).toHaveCount(0);
      await expect(page.getByText('Go Concurrency', { exact: true })).toBeVisible();
    });
  });
}
