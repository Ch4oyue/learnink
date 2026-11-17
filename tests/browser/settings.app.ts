import { test, expect } from '@playwright/test';
import { installApp, isDark } from './support/app';

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('settings: theme tiles switch the theme and it survives a reload', async ({ page }) => {
      await installApp(page);
      await page.goto('/dashboard/settings');
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      expect(await isDark(page)).toBe(false);
      await page.getByRole('button', { name: /^Dark/ }).click();
      await expect.poll(() => isDark(page)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
      await page.reload();
      await expect.poll(() => isDark(page)).toBe(true);
      await page.getByRole('button', { name: /^Light/ }).click();
      await expect.poll(() => isDark(page)).toBe(false);
    });
  });
}

test.describe('mobile only', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('settings: transparent navigation toggle flips and persists', async ({ page }) => {
    await installApp(page);
    await page.goto('/dashboard/settings');
    const toggle = page.getByRole('button', { name: /^(Enabled|Disabled)$/ });
    await expect(toggle).toHaveText('Disabled');
    await toggle.click();
    await expect(toggle).toHaveText('Enabled');
    expect(await page.evaluate(() => localStorage.getItem('transparentMobileNav'))).toBe('true');
  });
});
