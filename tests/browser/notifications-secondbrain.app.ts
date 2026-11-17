import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const notifications = () => [
  { id: 'n1', user_id: USER_ID, title: 'Request approved', message: 'Your material request was approved', type: 'success', is_read: false, related_request_id: null, related_module_id: null, created_at: ago(3600e3) },
  { id: 'n2', user_id: USER_ID, title: 'New module', message: 'A new module is published', type: 'info', is_read: false, related_request_id: null, related_module_id: null, created_at: ago(7200e3) },
  { id: 'n3', user_id: USER_ID, title: 'Welcome', message: 'Welcome to LearnInk', type: 'info', is_read: true, related_request_id: null, related_module_id: null, created_at: ago(86400e3) },
];
const notes = () => [
  { id: 'k1', user_id: USER_ID, module_id: 'm1', content: 'Flexbox aligns along the main axis', highlighted_text: 'justify-content', created_at: ago(3600e3), updated_at: ago(3600e3) },
  { id: 'k2', user_id: USER_ID, module_id: 'm2', content: 'Closures capture scope', highlighted_text: null, created_at: ago(7200e3), updated_at: ago(7200e3) },
  { id: 'k3', user_id: USER_ID, module_id: 'm1', content: 'Grid vs flex tradeoffs', highlighted_text: null, created_at: ago(9200e3), updated_at: ago(9200e3) },
];

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('notifications: mark one read, then mark all read', async ({ page }) => {
      const app = await installApp(page, { db: { notifications: notifications() } });
      await page.goto('/dashboard/notifications');
      await expect(page.getByText('2 unread notifications')).toBeVisible();
      await page.getByText('Request approved').click();
      await expect(page.getByText('1 unread notifications')).toBeVisible();
      expect(app.writes.some((w) => w.startsWith('PATCH notifications') && w.includes('id=eq.n1'))).toBe(true);
      await page.getByRole('button', { name: /mark all as read/i }).click();
      await expect(page.getByText('All notifications have been read')).toBeVisible();
      expect(app.db.notifications.every((n) => n.is_read === true)).toBe(true);
    });

    test('notifications: tapping one linked to a module opens that module', async ({ page }) => {
      const list = notifications();
      list[0].related_module_id = 'm1';
      await installApp(page, { db: { notifications: list } });
      await page.goto('/dashboard/notifications');
      await page.getByText('Request approved').click();
      await expect(page).toHaveURL(/\/learn\/m1$/); // legacy /module/:id redirects to /learn/:id
    });

    test('notifications: tapping a request notification lands on an existing page, not a 404', async ({ page }) => {
      const list = notifications();
      list[0].related_request_id = 'r1';
      await installApp(page, { db: { notifications: list } });
      await page.goto('/dashboard/notifications');
      await page.getByText('Request approved').click();
      await expect(page).toHaveURL(/\/dashboard\/requests$/);
    });

    test('second brain: list, search, module filter, delete', async ({ page }) => {
      const app = await installApp(page, { db: { learning_notes: notes(), modules: [{ id: 'm1', title: 'CSS Layout' }, { id: 'm2', title: 'JS Basics' }] } });
      await page.goto('/dashboard/second-brain');
      for (const t of ['Flexbox aligns', 'Closures capture', 'Grid vs flex']) await expect(page.getByText(t)).toBeVisible();
      await page.getByPlaceholder(/search notes/i).fill('closures');
      await expect(page.getByText('Closures capture')).toBeVisible();
      await expect(page.getByText('Flexbox aligns')).toHaveCount(0);
      await page.getByPlaceholder(/search notes/i).fill('');
      await page.getByRole('button', { name: /CSS Layout/ }).click();
      await expect(page.getByText('Grid vs flex')).toBeVisible();
      await expect(page.getByText('Closures capture')).toHaveCount(0);
      await page.getByRole('button', { name: /^All/ }).click();
      const card = page.getByText('Closures capture scope').locator('xpath=ancestor::div[contains(@class,"group")][1]');
      await card.hover();
      await card.getByRole('button').click({ force: true });
      await expect.poll(() => app.writes.some((w) => w.startsWith('DELETE learning_notes') && w.includes('id=eq.k2'))).toBe(true);
    });
  });
}
