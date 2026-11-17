import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const draft = (id: string, title: string) => ({
  id, title, source: 'manual', status: 'pending', created_at: '2026-11-02T00:00:00Z',
  raw_content: { content: `Body of ${title}`, category: 'general', level: 'beginner', summary: `${title} summary` },
});
const seed = () => ({
  user_roles: [{ user_id: USER_ID, role: 'admin' }],
  incoming_contents: [draft('c1', 'Intro to Prompting'), draft('c2', 'Spam Draft')],
  material_requests: [], modules: [],
});

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('approval: drafts list, publish writes a module and marks the draft approved', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed() });
      await page.goto('/dashboard/admin/approval');
      await expect(page.getByRole('heading', { name: 'Intro to Prompting' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Spam Draft' })).toBeVisible();
      await page.getByRole('button', { name: 'Review' }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
      await expect.poll(() => app.writes.some((w) => w.startsWith('POST modules'))).toBe(true);
      await expect.poll(() => app.db.incoming_contents.find((c) => c.id === 'c1')?.status).toBe('approved');
      expect(app.db.modules[0]).toMatchObject({ is_published: true, created_by: USER_ID });
    });

    test('approval: reject asks for confirmation and marks the draft rejected', async ({ page }) => {
      const app = await installApp(page, { role: 'admin', db: seed() });
      await page.goto('/dashboard/admin/approval');
      await page.getByRole('button').filter({ has: page.locator('svg.lucide-circle-x, svg.lucide-x-circle') }).nth(0).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
      expect(app.writes.filter((w) => w.startsWith('PATCH incoming_contents'))).toHaveLength(0);
      await page.getByRole('button').filter({ has: page.locator('svg.lucide-circle-x, svg.lucide-x-circle') }).nth(0).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Reject' }).click();
      await expect.poll(() => app.db.incoming_contents.filter((c) => c.status === 'rejected').length).toBe(1);
      expect(app.db.modules).toHaveLength(0);
    });
  });
}
