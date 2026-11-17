import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

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

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(`${label} tabs`, () => {
    test.use({ viewport });

    test('profile tabs: notes links to Second Brain, settings theme persists', async ({ page }) => {
      await installApp(page, { role: 'user' });
      await page.goto('/dashboard/profile?tab=notes');
      await page.getByRole('button', { name: /Open Second Brain/ }).click();
      await expect(page).toHaveURL(/\/dashboard\/second-brain$/);
      await page.goto('/dashboard/profile?tab=settings');
      await page.getByRole('button', { name: /^Dark/ }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
      await page.reload();
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    });

    test('profile premium: blocked when points or streak are short', async ({ page }) => {
      const app = await installApp(page, { role: 'user' });
      await page.goto('/dashboard/profile?tab=premium');
      await expect(page.getByText('LearnInk Elite')).toBeVisible();
      await expect(page.getByText('120 Points')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Not enough points' })).toHaveCount(2);
      await expect(page.getByRole('button', { name: 'Not enough points' }).first()).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Streak too low' })).toBeDisabled();
      expect(app.writes.filter((w) => w.startsWith('PATCH profiles'))).toHaveLength(0);
    });

    test('profile premium: redeeming 7 days goes through the server function, not a direct profile write', async ({ page }) => {
      const app = await installApp(page, { role: 'user', rpc: { redeem_premium: (_body, db) => { const p = db.profiles[0]; p.points = Number(p.points) - 500; p.is_premium = true; p.premium_until = '2026-11-24T00:00:00Z'; return p.premium_until; } }, db: { profiles: [{ id: USER_ID, display_name: 'Test Learner', avatar_url: null, current_streak: 3, longest_streak: 7, last_activity_date: '2026-11-17', points: 600, labels: [], is_premium: false, premium_until: null }] } });
      await page.goto('/dashboard/profile?tab=premium');
      await page.getByRole('button', { name: 'Redeem' }).first().click();
      await expect.poll(() => app.db.profiles[0]?.points).toBe(100);
      expect(app.db.profiles[0]).toMatchObject({ is_premium: true });
      expect(String(app.db.profiles[0]?.premium_until)).toMatch(/^2026-/);
      expect(app.writes.some((w) => w.startsWith('RPC redeem_premium') && w.includes('"7_days"'))).toBe(true);
      expect(app.writes.filter((w) => w.startsWith('PATCH profiles'))).toHaveLength(0);
    });
  });
}
