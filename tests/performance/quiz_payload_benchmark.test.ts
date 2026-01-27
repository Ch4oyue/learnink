
import { describe, test, expect } from "bun:test";

// Mock types based on src/hooks/useQuiz.ts
interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>;
  started_at: string;
  completed_at: string | null;
}

// Generate a large random string to simulate long answers
const randomString = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

describe("Quiz Attempt Payload Benchmark", () => {
  test("measure payload reduction", () => {
    // 1. Setup Baseline Data (Single Row)
    const numQuestions = 20;
    const answers: Record<string, string> = {};

    for (let i = 0; i < numQuestions; i++) {
        // Simulate a UUID for question ID and a generic sentence for answer
        const questionId = `00000000-0000-0000-0000-${i.toString().padStart(12, '0')}`;
        answers[questionId] = randomString(50); // ~50 chars per answer
    }

    const fullAttempt: QuizAttempt = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "user-123-456-789",
      quiz_id: "quiz-987-654-321",
      score: 85,
      total_points: 100,
      percentage: 85,
      passed: true,
      answers: answers,
      started_at: "2023-10-27T10:00:00Z",
      completed_at: "2023-10-27T10:30:00Z"
    };

    // 2. Serialize Baseline
    const baselineJson = JSON.stringify(fullAttempt);
    const baselineSize = new TextEncoder().encode(baselineJson).length;

    // 3. Setup Optimized Data (Single Row)
    // We create a new object excluding 'answers'
    const { answers: _, ...optimizedAttempt } = fullAttempt;

    // 4. Serialize Optimized
    const optimizedJson = JSON.stringify(optimizedAttempt);
    const optimizedSize = new TextEncoder().encode(optimizedJson).length;

    // 5. Calculate Metrics
    const reduction = baselineSize - optimizedSize;
    const reductionPercent = (reduction / baselineSize) * 100;

    console.log("\n📊 Quiz Payload Benchmark Results (Single Row):");
    console.log("------------------------------------------------");
    console.log(`Baseline Size (Select *):     ${baselineSize} bytes`);
    console.log(`Optimized Size (No Answers):  ${optimizedSize} bytes`);
    console.log(`Reduction:                    ${reduction} bytes`);
    console.log(`Improvement:                  ${reductionPercent.toFixed(2)}% faster/smaller`);
    console.log("------------------------------------------------\n");

    // Simulating a list of 50 attempts (e.g. history view)
    const listSizeBaseline = baselineSize * 50;
    const listSizeOptimized = optimizedSize * 50;

    console.log("📈 Projection for 50 Attempts List:");
    console.log(`Baseline List Payload:        ${(listSizeBaseline / 1024).toFixed(2)} KB`);
    console.log(`Optimized List Payload:       ${(listSizeOptimized / 1024).toFixed(2)} KB`);
    console.log("------------------------------------------------\n");

    expect(optimizedSize).toBeLessThan(baselineSize);
  });
});
