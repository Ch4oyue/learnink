import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const tracks = () => [
  { id: 't1', name: 'Frontend Foundations', slug: 'frontend', description: 'HTML, CSS and modern JavaScript.', icon: 'BookOpen', is_active: true },
  { id: 't2', name: 'Backend Basics', slug: 'backend', description: 'Servers, APIs and databases.', icon: 'BookOpen', is_active: true },
];
const modules = () => [
  { id: 'm1', track_id: 't1', title: 'Semantic HTML', summary: 'Structure that means something', level: 'Beginner', is_published: true },
  { id: 'm2', track_id: 't1', title: 'CSS Layout', summary: 'Flexbox and grid', level: 'Beginner', is_published: true },
  { id: 'm3', track_id: 't2', title: 'HTTP Basics', summary: 'Requests and responses', level: 'Beginner', is_published: true },
];
const seed = () => ({
  tracks: tracks(),
  modules: modules(),
  user_tracks: [{ id: 'ut1', user_id: USER_ID, track_id: 't1' }],
  user_progress: [{ id: 'p1', user_id: USER_ID, module_id: 'm1', progress_percent: 100, is_completed: true, started_at: null, completed_at: null }],
});

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('catalog: shows enrolled state, search filters', async ({ page }) => {
      await installApp(page, { db: seed() });
      await page.goto('/dashboard/courses');
      await expect(page.getByRole('heading', { name: 'Frontend Foundations' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue Learning' })).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Take Course' })).toHaveCount(1);
      await page.getByPlaceholder('Search courses...').fill('servers');
      await expect(page.getByRole('heading', { name: 'Backend Basics' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Frontend Foundations' })).toHaveCount(0);
      await page.getByPlaceholder('Search courses...').fill('zzz');
      await expect(page.getByText('No Courses Found')).toBeVisible();
    });

    test('course detail: enrolled shows computed progress and Start/Retry links', async ({ page }) => {
      await installApp(page, { db: seed() });
      await page.goto('/dashboard/course/t1');
      await expect(page.getByText('Course Progress')).toBeVisible();
      await expect(page.getByText('50%')).toBeVisible();
      await expect(page.getByRole('link', { name: /Retry/ })).toHaveAttribute('href', '/learn/m1');
      await expect(page.getByRole('link', { name: /Start/ })).toHaveAttribute('href', '/learn/m2');
    });

    test('course detail: not enrolled shows locked modules and an enroll path', async ({ page }) => {
      await installApp(page, { db: seed() });
      await page.goto('/dashboard/course/t2');
      await expect(page.getByText(/not enrolled in this course/i)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Locked' })).toHaveCount(1);
      await page.getByRole('button', { name: 'Enroll Now' }).click();
      await expect(page).toHaveURL(/\/dashboard\/courses$/);
    });

    test('catalog: Take Course enrolls and the course opens unlocked', async ({ page }) => {
      const app = await installApp(page, { db: seed() });
      await page.goto('/dashboard/courses');
      await page.getByRole('button', { name: 'Take Course' }).click();
      await expect(page).toHaveURL(/\/dashboard\/course\/t2$/);
      expect(app.writes).toContain('POST user_tracks');
      expect(app.db.user_tracks.some((r) => r.track_id === 't2' && r.user_id === USER_ID)).toBe(true);
      await expect(page.getByText('Course Progress')).toBeVisible();
      await expect(page.getByText(/not enrolled in this course/i)).toHaveCount(0);
    });
  });
}
