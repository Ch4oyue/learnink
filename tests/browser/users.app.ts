import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const people = () => [
  { id: USER_ID, email: 'admin@example.test', display_name: 'Test Admin', avatar_url: null, created_at: '2026-01-01T00:00:00Z', role: 'admin', labels: [], points: 10, is_premium: false },
  { id: 'u2', email: 'ayu@example.test', display_name: 'Ayu Lestari', avatar_url: null, created_at: '2026-02-01T00:00:00Z', role: 'user', labels: [], points: 40, is_premium: false },
  { id: 'u3', email: 'budi@example.test', display_name: 'Budi Santoso', avatar_url: null, created_at: '2026-03-01T00:00:00Z', role: 'tutor', labels: [], points: 70, is_premium: false },
];
const payload = () => ({ users: people(), meta: { page: 1, limit: 50, total: 3, totalPages: 1 } });

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('users: list, role filter, self-row is locked', async ({ page }) => {
      await installApp(page, { role: 'admin', db: { user_roles: [{ user_id: USER_ID, role: 'admin' }], label_configs: [] }, functions: { 'get-users': payload } });
      await page.goto('/dashboard/users');
      await expect(page.getByText('Ayu Lestari').first()).toBeVisible();
      await expect(page.getByText('Budi Santoso').first()).toBeVisible();
      await page.locator('[data-slot="select-trigger"]').first().click();
      await page.getByRole('option', { name: 'Tutor', exact: true }).click();
      await expect(page.getByText('Budi Santoso').first()).toBeVisible();
      await expect(page.getByText('Ayu Lestari')).toHaveCount(0);
      await page.locator('[data-slot="select-trigger"]').first().click();
      await page.getByRole('option', { name: 'All Roles' }).click();
      await expect(page.getByRole('row').filter({ hasText: 'Test Admin' }).locator('[data-slot="select-trigger"]').last()).toBeDisabled();
    });

    test('users: changing a role asks for confirmation, cancel is inert, confirm writes', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: { user_roles: [{ user_id: USER_ID, role: 'admin' }, { user_id: 'u2', role: 'user' }], label_configs: [] }, functions: { 'get-users': payload } });
      await page.goto('/dashboard/users');
      const row = page.getByRole('row').filter({ hasText: 'Ayu Lestari' });
      const roleControl = row.locator('[data-slot="select-trigger"]').last();
      const box = await roleControl.boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= viewport.width).toBe(true);
      await roleControl.click();
      await page.getByRole('option', { name: 'Tutor', exact: true }).click();
      await expect(page.locator('[role=alertdialog]:not([aria-modal=false])')).toContainText('Confirm Role Change');
      expect(app.writes.filter((w) => w.startsWith('PATCH user_roles'))).toHaveLength(0);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.locator('[role=alertdialog]:not([aria-modal=false])')).toHaveCount(0);
      expect(app.writes.filter((w) => w.startsWith('PATCH user_roles') || w.startsWith('POST user_roles'))).toHaveLength(0);

      await row.locator('[data-slot="select-trigger"]').last().click();
      await page.getByRole('option', { name: 'Tutor', exact: true }).click();
      await page.locator('[role=alertdialog]:not([aria-modal=false])').getByRole('button').last().click();
      await expect.poll(() => app.writes.some((w) => w.startsWith('PATCH user_roles') && w.includes('user_id=eq.u2'))).toBe(true);
      expect(app.db.user_roles.find((r) => r.user_id === 'u2')).toMatchObject({ role: 'tutor' });
    });

    test('users: a failing get-users call shows the failure state instead of an empty table', async ({ page }) => {
      await installApp(page, { role: 'user', functions: {} });
      await page.goto('/dashboard/users');
      await expect(page.getByText(/Failed to Load Data|do not have admin access/i).first()).toBeVisible();
    });
  });
}
