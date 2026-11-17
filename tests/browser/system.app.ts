import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const seed = () => ({
  user_roles: [{ user_id: USER_ID, role: 'superadmin' }],
  system_settings: [
    { key: 'global_xp_multiplier', value: 1 }, { key: 'apk_base_bonus', value: 50 },
    { key: 'maintenance_mode', value: 'false' }, { key: 'broadcast_message', value: { enabled: false, title: '', content: '' } },
  ],
  label_configs: [{ id: 'beta-tester', multiplier: 1.5, description: 'Beta group', is_active: true }],
  security_logs: [],
});

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('system: XP multiplier save and maintenance toggle write system_settings', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      const xp = page.locator('input[type="number"]').first();
      await expect(xp).toHaveValue('1');
      await xp.fill('2.5');
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect.poll(() => app.db.system_settings.find((s) => s.key === 'global_xp_multiplier')?.value).toBe('2.5');
      await page.getByRole('switch').first().click();
      await expect.poll(() => app.db.system_settings.find((s) => s.key === 'maintenance_mode')?.value).toBe('true');
    });

    test('system: label list, add via prompt, delete asks for confirmation', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      await expect(page.getByText('beta-tester')).toBeVisible();
      page.once('dialog', (d) => d.accept('vip'));
      await page.getByRole('button', { name: 'Add Label' }).click();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'vip')).toBe(true);
      page.once('dialog', (d) => d.dismiss());
      await page.getByRole('row').filter({ hasText: 'beta-tester' }).getByRole('button').click();
      expect(app.writes.filter((w) => w.startsWith('DELETE label_configs'))).toHaveLength(0);
      page.once('dialog', (d) => d.accept());
      await page.getByRole('row').filter({ hasText: 'beta-tester' }).getByRole('button').click();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'beta-tester')).toBe(false);
    });
  });
}
