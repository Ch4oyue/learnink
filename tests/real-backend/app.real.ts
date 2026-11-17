import { test, expect } from '@playwright/test';
import { API, USERS, rest, resetState, signIn, tokenFor } from './support';

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async () => { await resetState(); });

const L = USERS.learner.id;

test('profile: editing the name persists in the real profiles table', async ({ page }) => {
  await signIn(page, 'learner');
  await page.goto('/dashboard/profile');
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  await page.getByPlaceholder('Your name').first().fill('Nadia Putri');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Profile updated successfully').first()).toBeVisible();
  const row = await rest(`profiles?id=eq.${L}&select=display_name`);
  expect(row.body[0].display_name).toBe('Nadia Putri');
});

test('premium: redeeming 7 days runs the server function and changes real points', async ({ page }) => {
  await signIn(page, 'learner');
  await page.goto('/dashboard/profile?tab=premium');
  await expect(page.getByText('600 Points')).toBeVisible();
  await page.getByRole('button', { name: 'Redeem' }).first().click();
  await expect(page.getByText('Activation successful').first()).toBeVisible();
  const row = await rest(`profiles?id=eq.${L}&select=points,is_premium,premium_until`);
  expect(row.body[0]).toMatchObject({ points: 100, is_premium: true });
  expect(new Date(row.body[0].premium_until).getTime()).toBeGreaterThan(Date.now() + 6 * 86400_000);
});

test('premium: a signed-in user cannot grant themselves points, premium or reward resets over the API', async () => {
  const patch = await rest(`profiles?id=eq.${L}`, { method: 'PATCH', as: 'learner', body: { points: 99999, is_premium: true } });
  expect(patch.status).toBe(403);
  const fakeAttempt = await rest('user_quiz_attempts', { method: 'POST', as: 'learner', body: { user_id: L, quiz_id: '22222222-2222-2222-2222-222222222222', score: 2, total_points: 2, percentage: 100, passed: true } });
  expect(fakeAttempt.status).toBe(403);
  const noPoints = await rest('rpc/redeem_premium', { method: 'POST', as: 'learner', body: { p_offer_id: '30_days' } });
  expect(noPoints.status).toBe(400);
  const after = await rest(`profiles?id=eq.${L}&select=points,is_premium`);
  expect(after.body[0]).toMatchObject({ points: 600, is_premium: false });
});

test('quiz: answers are graded by the real function and the attempt is stored', async ({ page }) => {
  await signIn(page, 'learner');
  await page.goto('/learn/11111111-1111-1111-1111-111111111111');
  await page.getByRole('button', { name: 'Next Page' }).click();
  await page.getByRole('button', { name: 'Take Quiz' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Flexbox check')).toBeVisible({ timeout: 20000 });
  await dialog.getByRole('button', { name: 'Start Quiz' }).click();
  await dialog.getByText('flex-direction').click();
  await expect(dialog.getByRole('radio',{name:'flex-direction',exact:true})).toBeChecked();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByText('True', { exact: true }).click();
  await expect(dialog.getByRole('radio',{name:'True',exact:true})).toBeChecked();
  await page.waitForTimeout(4500);
  await dialog.getByRole('button', { name: 'Finish' }).click();
  await expect(dialog.getByText('100%')).toBeVisible({ timeout: 20000 });
  const attempts = await rest(`user_quiz_attempts?user_id=eq.${L}&select=score,total_points,percentage,passed`);
  expect(attempts.body).toEqual([{ score: 2, total_points: 2, percentage: 100, passed: true }]);
});

for (const [name, size] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) test(`quiz ${name}: a failed attempt shows its result without crashing, and stores passed=false`, async ({ page }) => {
  await page.setViewportSize(size);
  await signIn(page, 'learner');
  await page.goto('/learn/11111111-1111-1111-1111-111111111111');
  await page.getByRole('button', { name: 'Next Page' }).click();
  await page.getByRole('button', { name: 'Take Quiz' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Flexbox check')).toBeVisible({ timeout: 20000 });
  await dialog.getByRole('button', { name: 'Start Quiz' }).click();
  await dialog.getByText('z-index').click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByText('False', { exact: true }).click();
  await page.waitForTimeout(4500);
  await dialog.getByRole('button', { name: 'Finish' }).click();
  await expect(dialog.getByText('0%', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Something Went Wrong')).toHaveCount(0);
  await expect(page.getByText('Try Again')).toHaveCount(0);
  const attempts = await rest(`user_quiz_attempts?user_id=eq.${L}&select=score,passed`);
  expect(attempts.body).toEqual([{ score: 0, passed: false }]);
});

test('admin users table is served by the real get-users function; a learner is refused', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/dashboard/users');
  await expect(page.getByRole('row')).toHaveCount(6, { timeout: 20000 }); // header + 5 seeded users
  for (const name of ['Tutor', 'Learner', 'Other']) {
    // Hidden native select options also contain role names; match the visible identity cell.
    await expect(page.getByRole('row').filter({ has: page.getByRole('rowheader').getByText(name, { exact: true }) })).toHaveCount(1);
  }
  await expect(page.getByText('Loading')).toHaveCount(0);
  const res = await fetch(`${API}/functions/v1/get-users?page=1&limit=10`, { headers: { Authorization: `Bearer ${tokenFor('learner')}` } });
  expect(res.status).toBe(403);
});

test('integrations: regenerate calls the real generate-api-key, then retires the old row', async ({ page }) => {
  const created = await fetch(`${API}/functions/v1/generate-api-key`, { method: 'POST', headers: { Authorization: `Bearer ${tokenFor('admin')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Nightly Import', source: 'n8n' }) });
  expect(created.status).toBe(201);
  const oldId = (await created.json()).integration.id;
  await signIn(page, 'admin');
  await page.goto('/dashboard/admin/integrations');
  await expect(page.getByText('Nightly Import').first()).toBeVisible({ timeout: 20000 });
  await page.locator('button:has(svg[class*="lucide-refresh"])').first().click();
  await page.locator('[role=alertdialog]:not([aria-modal=false])').getByRole('button', { name: 'Regenerate' }).click();
  await expect(page.getByText('API Key Updated').first()).toBeVisible({ timeout: 20000 });
  const rows = await rest('integrations?select=id,name,is_active');
  expect(rows.body).toHaveLength(1);
  expect(rows.body[0].id).not.toBe(oldId);
  expect(rows.body[0].name).toBe('Nightly Import');
});
