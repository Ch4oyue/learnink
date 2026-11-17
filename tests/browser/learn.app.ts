import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const content = ['# Flexbox Basics', 'Intro paragraph.', '## Axes', 'Main axis and cross axis.', '## Alignment', 'Use justify-content and align-items.', '## Wrapping', 'flex-wrap lets items flow onto new lines.'].join('\n\n');
const seed = () => ({
  user_roles: [{ user_id: USER_ID, role: 'user' }],
  modules: [{ id: 'm1', title: 'Flexbox Basics', summary: 'Layout in one dimension', level: 'beginner', category: 'general', is_published: true, created_at: '2026-11-01T00:00:00Z', created_by: 'x', track_id: null, content, icon_name: 'Bot', source_request_id: null }],
  user_progress: [], learning_notes: [],
});

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('learn: renders first section, TOC jumps to another section, no horizontal overflow', async ({ page }) => {
      await installApp(page, { role: 'user', db: seed() });
      await page.goto('/learn/m1');
      await expect(page.getByText('Intro paragraph.')).toBeVisible();
      if (label === 'mobile') await page.getByRole('button', { name: /menu|contents/i }).first().click().catch(() => {});
      await page.getByRole('button', { name: /Axes/ }).first().click();
      await expect(page.getByText('Main axis and cross axis.')).toBeVisible();
      if (label === 'mobile') await expect(page.getByRole('dialog')).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `/tmp/shots/learn-${label}.png` });
    });
  });
}
