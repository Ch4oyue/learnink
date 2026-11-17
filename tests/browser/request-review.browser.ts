import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/browser/fixtures/request-review.html');
});

test('admin vs tutor columns, fallbacks, action eligibility and status mutation', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Category', exact: true })).toBeVisible();
  await expect(page.getByText('Test Learner', { exact: true })).toBeVisible();
  await expect(page.getByText('AI Basics', { exact: true })).toBeVisible();
  await expect(page.getByText('General', { exact: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Generate AI', exact: true })).toHaveCount(2);
  await expect(page.getByText('Anonymous', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: 'Switch role view' }).click();
  await expect(page.getByRole('columnheader', { name: 'Category', exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader')).toHaveCount(5);
  await expect(page.getByRole('cell', { name: '11/16/2026', exact: true })).toHaveCount(4);
  const row = page.getByRole('row').filter({ hasText: 'Topic 0' });
  await row.locator('[data-slot="select-trigger"]').click();
  await page.getByRole('option', { name: 'Rejected', exact: true }).click();
  await expect(page.getByTestId('events')).toHaveText('[{"update":{"id":"request-0","status":"rejected"}}]');
  await expect(row.getByRole('button', { name: 'Generate AI' })).toHaveCount(0);
});

test('generate requires confirmation, cancel is inert, and next dialog uses next request', async ({ page }) => {
  await page.getByRole('row').filter({ hasText: 'Topic 0' }).getByRole('button', { name: 'Generate AI' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Topic 0');
  await expect(page.getByTestId('events')).toHaveText('[]');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByTestId('events')).toHaveText('[]');
  await page.getByRole('row').filter({ hasText: 'Topic 1' }).getByRole('button', { name: 'Generate AI' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Topic 1');
  await expect(page.getByRole('alertdialog')).not.toContainText('Topic 0');
  await page.getByRole('button', { name: 'Generate Module', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByTestId('events')).toHaveText('[{"generate":"request-1"}]');
});

test('raw filter values, loading, empty states and pending disabled buttons', async ({ page }) => {
  await page.locator('[data-slot="select-trigger"]').first().click();
  await page.getByRole('option', { name: 'Under Review', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Topic' })).toHaveCount(2);
  await expect(page.getByRole('row').filter({ hasText: 'Topic 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle generating' }).click();
  await expect(page.getByRole('button', { name: 'Generate AI' })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle loading' }).click();
  await expect(page.getByText('Loading...', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell').first()).toHaveAttribute('colspan', '6');
  await page.getByRole('button', { name: 'Toggle loading' }).click();
  await page.getByRole('button', { name: 'Empty requests' }).click();
  await expect(page.getByText('No requests', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch role view' }).click();
  await expect(page.getByRole('cell').first()).toHaveAttribute('colspan', '5');
});

test('desktop and mobile role views render the shared panel', async ({ page }, testInfo) => {
  for (const [name, width] of [['desktop', 1280], ['mobile', 390]] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: testInfo.outputPath(`${name}-admin.png`), fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Switch role view' }).click();
    await page.screenshot({ path: testInfo.outputPath(`${name}-tutor.png`), fullPage: true, animations: 'disabled' });
    await page.getByRole('row').filter({ hasText: 'Topic 0' }).getByRole('button', { name: 'Generate AI' }).click();
    await page.screenshot({ path: testInfo.outputPath(`${name}-dialog.png`), fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Switch role view' }).click();
  }
});
