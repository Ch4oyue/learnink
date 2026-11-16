import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

// Narrow regression guards for the four reviewed mixed-language defects.
// These inspect source strings; they do not exercise authenticated routes.
describe('reviewed English-copy regressions', () => {
  const cases = [
    ['src/pages/learning/Modules.tsx', 'No modules available yet', 'No modules yet yang tersedia saat ini'],
    ['src/pages/dashboard/DashboardRequestMaterial.tsx', 'New Material Request', 'Material Requests Baru'],
    ['src/pages/dashboard/DashboardRequests.tsx', 'New Material Request', 'Material Requests Baru'],
    ['src/components/features/module/ModuleEditor.tsx', '"Saving..." : "Save"', '"Saving..." : "Simpan"'],
  ];
  for (const [path, wanted, previous] of cases) {
    test(path, () => {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain(wanted);
      expect(source).not.toContain(previous);
    });
  }
});

// Reviewed JSX labels and the stored true/false answer values are separate.
// These remain source-level guards, not rendered authenticated-route coverage.
describe('reviewed JSX copy and answer-value preservation', () => {
  test('generate dialogs use English UI copy', () => {
    const source = readFileSync('src/components/features/dashboard/RequestReviewPanel.tsx', 'utf8');
    expect(source).toContain('AI will create a learning module for the request');
    expect(source).toContain('This may take a few seconds.');
    expect(source).not.toContain('Generate Modul\n');
  });
  test('quiz translates display labels without changing submitted values', () => {
    const source = readFileSync('src/components/features/quiz/QuizPlayer.tsx', 'utf8');
    expect(source).toContain('["Benar", "Salah"].map');
    expect(source).toContain('value={option.toLowerCase()}');
    expect(source).toContain('{option === "Benar" ? "True" : "False"}');
    expect(source).toContain('Review Answers');
  });
  test('reviewed loading and request JSX labels stay English', () => {
    const source = readFileSync('src/components/features/dashboard/AdminDashboard.tsx', 'utf8');
    expect(source).not.toContain('Memuat...');
    expect(source).toContain('Total Modules');
    const requests = readFileSync('src/components/features/sections/RequestSection.tsx', 'utf8');
    expect(requests).toContain('Need Specific Material?');
    expect(requests).toContain('Learning Goals');
  });
});
