import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const src = (id: string, name: string, active = true) => ({
  id, name, logo_url: 'https://example.test/logo.png', website_url: 'https://example.test', description: `${name} courses`,
  category: 'course', display_order: 1, is_active: active, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
});
const seed = () => ({ user_roles: [{ user_id: USER_ID, role: 'admin' }], learning_sources: [src('s1', 'Coursera'), src('s2', 'Udemy', false)] });

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('sources: list, search, toggle active, create, delete confirm', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed() });
      await page.goto('/dashboard/admin/sources');
      await expect(page.getByText('Coursera').first()).toBeVisible();
      await expect(page.getByText('Udemy').first()).toBeVisible();
      await page.getByPlaceholder('Search sources...').fill('udem');
      await expect(page.getByText('Coursera')).toHaveCount(0);
      await page.getByPlaceholder('Search sources...').fill('');

      await page.getByRole('row').filter({ hasText: 'Udemy' }).getByRole('switch').press('Space');
      await expect.poll(() => app.db.learning_sources.find((s) => s.id === 's2')?.is_active).toBe(true);

      await page.getByRole('button', { name: /Add Source|Add/ }).first().click();
      await page.getByLabel('Name *').fill('edX');
      await page.getByLabel('Logo URL *').fill('https://example.test/edx.png');
      await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
      await expect.poll(() => app.db.learning_sources.some((s) => s.name === 'edX')).toBe(true);

      await page.getByRole('row').filter({ hasText: 'Coursera' }).getByRole('button').last().click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
      expect(app.writes.filter((w) => w.startsWith('DELETE learning_sources'))).toHaveLength(0);
      await page.getByRole('row').filter({ hasText: 'Coursera' }).getByRole('button').last().click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect.poll(() => app.db.learning_sources.some((s) => s.id === 's1')).toBe(false);
    });
  });
}
