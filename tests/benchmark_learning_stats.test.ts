
import { describe, test, expect } from "bun:test";

// Mock data generators
const generateProgress = (count: number) => {
  return Array.from({ length: count }, () => ({
    progress_percent: Math.floor(Math.random() * 100),
    is_completed: Math.random() > 0.5,
  }));
};

const generateQuizAttempts = (count: number) => {
  return Array.from({ length: count }, () => ({
    score: Math.floor(Math.random() * 10),
    percentage: Math.floor(Math.random() * 100),
    passed: Math.random() > 0.5,
  }));
};

// Original Client-Side Logic
const clientSideAggregation = (progressData: any[], quizData: any[], notesCount: number, notesWeekCount: number) => {
  const totalModulesStarted = progressData.length;
  const completedModules = progressData.filter((p) => p.is_completed).length;
  const averageProgress =
    progressData.length > 0
      ? Math.round(
          progressData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) /
            progressData.length
        )
      : 0;

  const quizzesCompleted = quizData.length;
  const quizzesPassed = quizData.filter((q) => q.passed).length;
  const averageQuizScore =
    quizData.length > 0
      ? Math.round(
          quizData.reduce((sum, q) => sum + (q.percentage || 0), 0) /
            quizData.length
        )
      : 0;

  const totalNotes = notesCount;
  const notesThisWeek = notesWeekCount;
  const currentStreak = Math.min(7, completedModules + quizzesPassed);

  return {
    totalModulesStarted,
    completedModules,
    averageProgress,
    quizzesCompleted,
    quizzesPassed,
    averageQuizScore,
    totalNotes,
    notesThisWeek,
    currentStreak,
  };
};

describe("Learning Stats Benchmark", () => {
  test("Client-side aggregation performance vs DB RPC simulation", () => {
    // Simulate a moderately active user
    const ITEM_COUNT = 1000;
    const progressData = generateProgress(ITEM_COUNT);
    const quizData = generateQuizAttempts(ITEM_COUNT);
    const notesCount = 50;
    const notesWeekCount = 5;

    // Measure Client Side
    const startClient = performance.now();

    // Simulate JSON parsing overhead from network response
    const jsonProgress = JSON.parse(JSON.stringify(progressData));
    const jsonQuiz = JSON.parse(JSON.stringify(quizData));

    const clientResult = clientSideAggregation(jsonProgress, jsonQuiz, notesCount, notesWeekCount);
    const endClient = performance.now();
    const clientDuration = endClient - startClient;

    console.log(`\n--- BENCHMARK RESULTS ---`);
    console.log(`Items processed: ${ITEM_COUNT} progress entries, ${ITEM_COUNT} quiz entries`);
    console.log(`Client-side time (parse + aggregate): ${clientDuration.toFixed(4)}ms`);

    // Measure RPC Side (Simulation)
    // RPC returns just the final object, so we only simulate parsing that single small object
    const rpcResponse = {
      totalModulesStarted: 100,
      completedModules: 50,
      averageProgress: 75,
      quizzesCompleted: 100,
      quizzesPassed: 80,
      averageQuizScore: 85,
      totalNotes: 50,
      notesThisWeek: 5,
      currentStreak: 7
    };

    const startRPC = performance.now();
    const jsonRPC = JSON.parse(JSON.stringify(rpcResponse));
    const endRPC = performance.now();
    const rpcDuration = endRPC - startRPC;

    console.log(`RPC-side time (client parse only): ${rpcDuration.toFixed(4)}ms`);
    console.log(`Improvement: ${(clientDuration / rpcDuration).toFixed(2)}x faster on client CPU`);
    console.log(`-------------------------\n`);

    expect(clientResult).toBeDefined();
    expect(rpcDuration).toBeLessThan(clientDuration);
  });
});
