import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const seed = () => ({
  user_roles: [{ user_id: USER_ID, role: 'superadmin' }],
  system_settings: [
    { key: 'global_xp_multiplier', value: '1.0' }, { key: 'apk_base_bonus', value: '1.0' },
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
      await expect(xp).toHaveValue('1.0');
      await xp.fill('2.5');
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect.poll(() => app.db.system_settings.find((s) => s.key === 'global_xp_multiplier')?.value).toBe('2.5');
      await page.getByRole('switch').first().press('Space');
      await expect.poll(() => app.db.system_settings.find((s) => s.key === 'maintenance_mode')?.value).toBe('true');
    });

    test('system: invalid multiplier cannot be saved', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      const xp = page.locator('input[type="number"]').first();
      await xp.fill('-2');
      await expect(page.getByRole('alert').first()).toContainText('Enter a number');
      await expect(page.getByRole('button', { name: 'Save' }).first()).toBeDisabled();
      await xp.fill('');
      await expect(page.getByRole('button', { name: 'Save' }).first()).toBeDisabled();
      expect(app.writes.filter((w) => w.startsWith('PATCH system_settings'))).toHaveLength(0);
    });

    test('system: a valid multiplier keeps its text form when saved', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      const xp = page.locator('input[type="number"]').first();
      await xp.fill('1.0');
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect.poll(() => app.db.system_settings.find((s) => s.key === 'global_xp_multiplier')?.value).toBe('1.0');
    });

    test('system: failed add label keeps the dialog open and reports the error', async ({ page }) => {
      const app = await installApp(page, {
        role: 'superadmin', db: seed(), failWrites: (d) => d === 'POST label_configs',
      });
      await page.goto('/dashboard/admin/system');
      await page.getByRole('button', { name: 'Add Label' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Label ID').fill('vip');
      await dialog.getByRole('button', { name: 'Add label' }).click();
      await expect(page.getByText('Failed to save label', { exact: true }).first()).toBeVisible();
      await expect(dialog).toBeVisible();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'vip')).toBe(false);
    });

    test('system: failed delete keeps the confirm open and reports the error', async ({ page }) => {
      const app = await installApp(page, {
        role: 'superadmin', db: seed(), failWrites: (d) => d.startsWith('DELETE label_configs'),
      });
      await page.goto('/dashboard/admin/system');
      await page.getByRole('button', { name: 'Delete label beta-tester' }).click();
      const confirm = page.getByRole('alertdialog');
      await confirm.getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByText('Failed to delete label', { exact: true }).first()).toBeVisible();
      await expect(confirm).toBeVisible();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'beta-tester')).toBe(true);
    });

    test('system: labels use accessible dialogs with validation (add, duplicate, delete confirm, bad multiplier)', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      let nativeDialogs = 0;
      page.on('dialog', (d) => { nativeDialogs += 1; void d.dismiss(); });
      await page.goto('/dashboard/admin/system');
      await expect(page.getByText('beta-tester')).toBeVisible();

      await page.getByRole('button', { name: 'Add Label' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Label ID').fill('has space');
      await expect(dialog.getByRole('alert')).toContainText('without spaces');
      await expect(dialog.getByRole('button', { name: 'Add label' })).toBeDisabled();
      await dialog.getByLabel('Label ID').fill('beta-tester');
      await expect(dialog.getByRole('alert')).toContainText('already exists');
      await expect(dialog.getByRole('button', { name: 'Add label' })).toBeDisabled();
      await dialog.getByLabel('Label ID').fill('vip');
      await page.screenshot({ path: `/tmp/shots/system-add-label-${label}.png` });
      await dialog.getByRole('button', { name: 'Add label' }).click();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'vip')).toBe(true);
      expect(app.db.label_configs.find((l) => l.id === 'vip')).toMatchObject({ multiplier: 1, is_active: true });

      const mult = page.getByLabel('Multiplier for beta-tester');
      await mult.fill('-1');
      await mult.blur();
      expect(app.db.label_configs.find((l) => l.id === 'beta-tester')).toMatchObject({ multiplier: 1.5 });
      await mult.fill('2');
      await mult.blur();
      await expect.poll(() => app.db.label_configs.find((l) => l.id === 'beta-tester')?.multiplier).toBe(2);

      await page.getByRole('button', { name: 'Delete label beta-tester' }).click();
      await expect(page.getByRole('alertdialog')).toContainText('Delete label beta-tester?');
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
      expect(app.writes.filter((w) => w.startsWith('DELETE label_configs'))).toHaveLength(0);
      await page.getByRole('button', { name: 'Delete label beta-tester' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect.poll(() => app.db.label_configs.some((l) => l.id === 'beta-tester')).toBe(false);
      expect(nativeDialogs).toBe(0);
    });

    test('system: Reset All User Points is disabled and says why', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      const reset = page.getByRole('button', { name: 'Reset All User Points' });
      await reset.scrollIntoViewIfNeeded();
      await expect(reset).toBeDisabled();
      await expect(page.getByText('Not available yet.')).toBeVisible();
      await page.screenshot({ path: `/tmp/shots/system-danger-${label}.png` });
      expect(app.writes).toHaveLength(0);
    });

    test('system: label rows are usable at this width (edit description, toggle, controls on screen, no sideways scroll)', async ({ page }) => {
      const app = await installApp(page, { role: 'superadmin', db: seed() });
      await page.goto('/dashboard/admin/system');
      const del = page.getByRole('button', { name: 'Delete label beta-tester' });
      await del.scrollIntoViewIfNeeded();
      const vw = page.viewportSize()!.width;
      for (const loc of [del, page.getByRole('switch', { name: 'Label beta-tester active' }), page.getByLabel('Description for beta-tester'), page.getByLabel('Multiplier for beta-tester')]) {
        const box = await loc.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(vw);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `/tmp/shots/system-labels-${label}.png` });

      const desc = page.getByLabel('Description for beta-tester');
      await desc.fill('Closed beta');
      await desc.blur();
      await expect.poll(() => app.db.label_configs.find((l) => l.id === 'beta-tester')?.description).toBe('Closed beta');
      await page.getByRole('switch', { name: 'Label beta-tester active' }).press('Space');
      await expect.poll(() => app.db.label_configs.find((l) => l.id === 'beta-tester')?.is_active).toBe(false);
    });
  });
}
