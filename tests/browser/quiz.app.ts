import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';

const content = ['# Flexbox Basics', 'Intro.', '## Axes', 'Axes text.'].join('\n\n');
const quiz = { id: 'q1', module_id: 'm1', title: 'Flexbox check', description: 'Two questions', time_limit_minutes: 5, passing_score: 70, created_by: 'x', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z' };
const questions = [
  { id: 'qq1', quiz_id: 'q1', question_text: 'Which property sets the main axis?', question_type: 'multiple_choice', options: ['flex-direction', 'z-index'], points: 1, order_index: 0 },
  { id: 'qq2', quiz_id: 'q1', question_text: 'Flex items stay on a single line by default.', question_type: 'true_false', options: ['True', 'False'], points: 1, order_index: 1 },
];
const seed = (withQuiz = true) => ({
  user_roles: [{ user_id: USER_ID, role: 'user' }],
  modules: [{ id: 'm1', title: 'Flexbox Basics', summary: 's', level: 'beginner', category: 'general', is_published: true, created_at: '2026-11-01T00:00:00Z', created_by: 'x', track_id: null, content, icon_name: 'Bot', source_request_id: null }],
  user_progress: [], learning_notes: [],
  quizzes: withQuiz ? [quiz] : [],
  user_quiz_attempts: [{ id: 'a1', user_id: USER_ID, quiz_id: 'q1', score: 1, total_points: 2, percentage: 50, passed: false, started_at: '2026-11-10T00:00:00Z', completed_at: '2026-11-10T00:05:00Z' }],
});

for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
  test.describe(label, () => {
    test.use({ viewport });

    test('quiz: offered on the last section, answers go to the grading function, result is shown', async ({ page }) => {
      const submitted: unknown[] = [];
      const holder: { app?: Awaited<ReturnType<typeof installApp>> } = {};
      holder.app = await installApp(page, {
        role: 'user', db: seed(), rpc: { get_quiz_questions_safe: questions },
        functions: {
          'validate-quiz-answers': ({ body }) => {
            submitted.push(body);
            // The real function records the attempt server-side; mirror that so the list refreshes.
            holder.app?.db.user_quiz_attempts.push({ id: 'a2', user_id: USER_ID, quiz_id: 'q1', score: 2, total_points: 2, percentage: 100, passed: true, started_at: '2026-11-17T00:00:00Z', completed_at: '2026-11-17T00:03:00Z' });
            return { attempt: { id: 'a2', user_id: USER_ID, quiz_id: 'q1', score: 2, total_points: 2, percentage: 100, passed: true, answers: {}, started_at: '', completed_at: '' },
              results: { score: 2, totalPoints: 2, percentage: 100, passed: true, correctAnswers: { qq1: true, qq2: true }, explanations: {}, correctAnswerValues: {} } };
          },
        },
      });
      await page.goto('/learn/m1');
      await expect(page.getByRole('button', { name: 'Take Quiz' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Next Page' }).click();
      await page.getByRole('button', { name: 'Take Quiz' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Flexbox check')).toBeVisible({ timeout: 20000 });
      await expect(dialog.getByText('1 attempts')).toBeVisible();
      await expect(dialog.getByText('Best score: 50%')).toBeVisible();
      await dialog.getByRole('button', { name: 'Start Quiz' }).click();
      await expect(dialog.getByText('Which property sets the main axis?')).toBeVisible();
      await dialog.getByText('flex-direction').click();
      await dialog.getByRole('button', { name: 'Next' }).click();
      await dialog.getByText('True', { exact: true }).click();
      await dialog.getByRole('button', { name: 'Finish' }).click();
      await expect(dialog.getByText('100%')).toBeVisible();
      expect(submitted[0]).toMatchObject({ quiz_id: 'q1', answers: { qq1: 'flex-direction' } });
      await expect(dialog.getByText('Your answer: True')).toBeVisible();
      expect(submitted[0]).toMatchObject({ answers: { qq2: 'benar' } });
      await page.screenshot({ path: `/tmp/shots/quiz-result-${label}.png` });
      await dialog.getByRole('button', { name: 'Back to Modules' }).click();
      await expect(dialog.getByText('Flexbox check')).toBeVisible();
      await expect(dialog.getByText('2 attempts')).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Take Quiz' })).toBeVisible();
    });

    test('quiz: no button when the module has no quiz', async ({ page }) => {
      await installApp(page, { role: 'user', db: seed(false) });
      await page.goto('/learn/m1');
      await page.getByRole('button', { name: 'Next Page' }).click();
      await expect(page.getByRole('button', { name: 'Restart Progress' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Take Quiz' })).toHaveCount(0);
    });
  });
}
