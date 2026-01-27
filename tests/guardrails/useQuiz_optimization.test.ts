
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Quiz Hook Optimization Guardrails", () => {
  test("useUserQuizAttempts should select specific columns to avoid over-fetching", () => {
    const filePath = join(process.cwd(), "src/hooks/useQuiz.ts");
    const content = readFileSync(filePath, "utf-8");

    // We expect the explicit column selection instead of '*'
    const expectedQueryPart = '.select(\n          "id, user_id, quiz_id, score, total_points, percentage, passed, started_at, completed_at"\n        )';
    // Note: formatting might vary, so we can check for the string content more loosely if needed.
    // Let's check for the presence of the column list.
    const columns = "id, user_id, quiz_id, score, total_points, percentage, passed, started_at, completed_at";

    expect(content).toContain(columns);
    expect(content).not.toContain('.from("user_quiz_attempts")\n        .select("*")');
    // We can't strictly assert not containing select("*") globally because other functions might use it,
    // but we can check if it's near useUserQuizAttempts if we parse the AST, but string search is enough for now.

    // Verify that the 'answers' column is NOT in the list
    const attemptsFunctionBlock = content.split('export function useUserQuizAttempts')[1].split('enabled: !!userId')[0];
    expect(attemptsFunctionBlock).toContain(columns);
    expect(attemptsFunctionBlock).not.toContain('answers');
  });
});
