import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const modules = [
  { id: 'm1', title: 'CSS Layout', summary: 'Grid and flex', level: 'beginner', category: 'general', is_published: true, created_at: '2026-11-01T00:00:00Z', created_by: USER_ID, track_id: null, content: '# A\n\n## B\n\ntext', icon_name: 'Bot', source_request_id: null },
  { id: 'm2', title: 'Draft Module', summary: 'Work in progress', level: 'beginner', category: 'general', is_published: false, created_at: '2026-11-02T00:00:00Z', created_by: USER_ID, track_id: null, content: '', icon_name: 'Bot', source_request_id: null },
];

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });
    for (const role of ['user', 'tutor', 'admin', 'superadmin'] as const) {
      test(`dashboard home renders for ${role} with data and does not overflow`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await installApp(page, { role, db: { modules, user_roles: [{ user_id: USER_ID, role }], material_requests: [], user_progress: [] } });
        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await page.waitForTimeout(800);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
        await page.screenshot({ path: `/tmp/shots/dash-${role}-${label}.png` });
      });
    }
  });
}
