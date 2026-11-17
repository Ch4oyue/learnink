import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const integ = (id: string, name: string, active = true) => ({
  id, name, source: 'n8n', description: `${name} flow`, api_key_preview: 'lk_abcd...', api_key_hash: 'hash', is_active: active,
  created_by: USER_ID, created_at: '2026-10-01T00:00:00Z', last_used_at: null, request_count: 0, webhook_url: 'https://example.test/hook',
});
const seed = () => ({ user_roles: [{ user_id: USER_ID, role: 'admin' }], integrations: [integ('i1', 'Nightly Import'), integ('i2', 'Notion Sync', false)] });

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('integrations: list, toggle, generate key shows it once, delete confirm', async ({ page }) => {
      const calls: unknown[] = [];
      const app = await installApp(page, {
        role: 'admin', db: seed(),
        functions: { 'generate-api-key': ({ body }) => { calls.push(body); return { success: true, api_key: 'lk_test_secret_key' }; } },
      });
      await page.goto('/dashboard/admin/integrations');
      await expect(page.getByText('Nightly Import').first()).toBeVisible();
      await expect(page.getByText('Notion Sync').first()).toBeVisible();

      await page.getByRole('switch').nth(1).click();
      await expect.poll(() => app.db.integrations.find((i) => i.id === 'i2')?.is_active).toBe(true);

      await page.getByRole('button', { name: 'Add Integration' }).first().click();
      await page.getByLabel('Integration Name *').fill('Zap Hook');
      await page.getByRole('button', { name: 'Generate API Key' }).click();
      await expect(page.getByText('lk_test_secret_key')).toBeVisible();
      expect(calls[0]).toMatchObject({ name: 'Zap Hook', source: 'n8n' });
    });

    test('integrations: delete asks first, cancel is inert, confirm deletes', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed(), functions: {} });
      await page.goto('/dashboard/admin/integrations');
      const trash = () => page.locator('button:has(svg[class*="lucide-trash"])').first();
      await trash().click();
      await expect(page.getByRole('alertdialog')).toContainText('Delete Integration?');
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
      expect(app.writes.filter((w) => w.startsWith('DELETE integrations'))).toHaveLength(0);
      await trash().click();
      await page.getByRole('alertdialog').getByRole('button').last().click();
      await expect.poll(() => app.db.integrations.some((i) => i.id === 'i1')).toBe(false);
    });
    test('integrations: regenerate creates the new key first, then retires the old one', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed(), functions: { 'generate-api-key': () => ({ success: true, api_key: 'lk_new_key' }) } });
      await page.goto('/dashboard/admin/integrations');
      await page.locator('button:has(svg[class*="lucide-refresh"])').first().click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Regenerate' }).click();
      await expect(page.getByText('lk_new_key')).toBeVisible();
      await expect.poll(() => app.db.integrations.some((i) => i.id === 'i1')).toBe(false);
    });

    test('integrations: a failed regenerate keeps the existing integration', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed(), functions: { 'generate-api-key': () => ({ success: false, error: 'key service down' }) } });
      await page.goto('/dashboard/admin/integrations');
      await page.locator('button:has(svg[class*="lucide-refresh"])').first().click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Regenerate' }).click();
      await expect(page.getByText('key service down').first()).toBeVisible();
      expect(app.writes.filter((w) => w.startsWith('DELETE integrations'))).toHaveLength(0);
      expect(app.db.integrations.some((i) => i.id === 'i1')).toBe(true);
    });
  });
}
