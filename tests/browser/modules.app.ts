import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const mod = (id: string, title: string, published: boolean, created_by = USER_ID) => ({
  id, title, summary: `${title} summary`, level: 'beginner', category: 'general', is_published: published,
  created_at: '2026-11-01T00:00:00Z', created_by, track_id: null, content: '', source_request_id: null,
});
const seed = () => ({ modules: [mod('m1', 'CSS Layout', true), mod('m2', 'Draft Module', false), mod('m3', 'Other Tutor Module', true, 'someone-else')] });

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('modules (tutor): own modules, search, and the All tab lists published ones', async ({ page }) => {
      await installApp(page, { role: 'tutor', db: { ...seed(), user_roles: [{ user_id: USER_ID, role: 'tutor' }] } });
      await page.goto('/dashboard/modules');
      await expect(page.getByText('CSS Layout', { exact: true })).toBeVisible();
      await expect(page.getByText('Draft Module', { exact: true })).toBeVisible();
      await expect(page.getByText('Other Tutor Module', { exact: true })).toHaveCount(0);
      await page.getByPlaceholder('Search modules...').fill('draft');
      await expect(page.getByText('CSS Layout', { exact: true })).toHaveCount(0);
      await page.getByPlaceholder('Search modules...').fill('');
      await page.getByRole('tab', { name: 'All Modules' }).click();
      await expect(page.getByText('Other Tutor Module', { exact: true })).toBeVisible();
      await expect(page.getByText('Draft Module', { exact: true })).toHaveCount(0);
    });

    test('modules (tutor): Create Module opens the editor, not a 404', async ({ page }) => {
      await installApp(page, { role: 'tutor', db: { ...seed(), user_roles: [{ user_id: USER_ID, role: 'tutor' }] } });
      await page.goto('/dashboard/modules');
      await page.getByRole('link', { name: /Create Module/ }).first().click();
      await expect(page).toHaveURL(/\/dashboard\/modules\/create$/);
      await expect(page.getByRole('heading', { name: 'Create New Module' })).toBeVisible();
    });

    test('modules (tutor): Edit from the row menu opens that module in the editor', async ({ page }) => {
      await installApp(page, { role: 'tutor', db: { ...seed(), user_roles: [{ user_id: USER_ID, role: 'tutor' }] } });
      await page.goto('/dashboard/modules');
      const row = page.getByRole('row').filter({ hasText: 'CSS Layout' });
      await row.getByRole('button', { name: 'Module Options' }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();
      await expect(page).toHaveURL(/\/dashboard\/modules\/edit\/m1$/);
      await expect(page.getByRole('heading', { name: 'Edit Module' })).toBeVisible();
    });

    test('modules (tutor): delete asks first, then sends DELETE for that module', async ({ page }) => {
      const app = await installApp(page, { role: 'tutor', db: { ...seed(), user_roles: [{ user_id: USER_ID, role: 'tutor' }] } });
      await page.goto('/dashboard/modules');
      const row = page.getByRole('row').filter({ hasText: 'Draft Module' });
      await row.getByRole('button', { name: 'Module Options' }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      expect(app.writes.filter((w) => w.startsWith('DELETE modules'))).toHaveLength(0);
      await page.getByRole('alertdialog').getByRole('button', { name: /delete/i }).click();
      await expect.poll(() => app.writes.some((w) => w.startsWith('DELETE modules') && w.includes('id=eq.m2'))).toBe(true);
      await expect(page.getByText('Draft Module', { exact: true })).toHaveCount(0);
    });

    test('editor: empty title is rejected, valid create writes a module, edit saves changes', async ({ page }) => {
      const app = await installApp(page, { role: 'tutor', db: { ...seed(), user_roles: [{ user_id: USER_ID, role: 'tutor' }] } });
      await page.goto('/dashboard/modules/create');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Module title is required')).toBeVisible();
      expect(app.writes.filter((w) => w.startsWith('POST modules'))).toHaveLength(0);
      await page.getByPlaceholder('Enter module title...').fill('Flexbox Basics');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page).toHaveURL(/\/dashboard\/modules$/);
      expect(app.db.modules.find((m) => m.title === 'Flexbox Basics')).toMatchObject({ created_by: USER_ID, is_published: false });

      await page.goto('/dashboard/modules/edit/m1');
      const title = page.getByPlaceholder('Enter module title...');
      await expect(title).toHaveValue('CSS Layout');
      await title.fill('CSS Layout v2');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page).toHaveURL(/\/dashboard\/modules$/);
      expect(app.writes.some((w) => w.startsWith('PATCH modules') && w.includes('id=eq.m1'))).toBe(true);
      expect(app.db.modules.find((m) => m.id === 'm1')).toMatchObject({ title: 'CSS Layout v2' });
    });

    test('authoring routes send a learner back to the dashboard', async ({ page }) => {
      await installApp(page, { role: 'user', db: seed() });
      await page.goto('/dashboard/modules/create');
      await expect(page).toHaveURL(/\/dashboard$/);
      await page.goto('/dashboard/modules/edit/m1');
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });
}
