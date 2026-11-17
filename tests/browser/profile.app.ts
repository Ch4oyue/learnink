import { test, expect } from '@playwright/test';
import { installApp } from './support/app';

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('profile: edit name saves to auth and profiles, cancel leaves it alone', async ({ page }) => {
      const app = await installApp(page, { role: 'user' });
      await page.goto('/dashboard/profile');
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByPlaceholder('Your name').first().fill('Nadia Putri');
      await page.getByRole('button', { name: 'Cancel' }).click();
      expect(app.writes.filter((w) => w.startsWith('PATCH profiles') || w.startsWith('PUT auth'))).toHaveLength(0);

      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByPlaceholder('Your name').first().fill('Nadia Putri');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect.poll(() => app.writes.some((w) => w.startsWith('PATCH profiles'))).toBe(true);
      expect(app.writes).toContain('PUT auth/user');
      expect(app.db.profiles[0]).toMatchObject({ display_name: 'Nadia Putri' });
      await expect(page.getByText('Profile updated successfully').first()).toBeVisible();
    });

    test('profile: a failing profiles write is reported, not shown as success', async ({ page }) => {
      await installApp(page, { role: 'user' });
      await page.route('**/rest/v1/profiles*', (route) =>
        route.request().method() === 'PATCH' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'write denied' }) }) : route.fallback());
      await page.goto('/dashboard/profile');
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await page.getByPlaceholder('Your name').first().fill('Nadia Putri');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText(/Failed to update profile|write denied/).first()).toBeVisible();
      await expect(page.getByText('Profile updated successfully')).toHaveCount(0);
    });
  });
}
