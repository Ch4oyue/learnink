import { describe, expect, it } from "bun:test";
import {
  summarizeProgress,
  summarizeQuizAttempts,
  computeTrackProgress,
  activitySeries,
} from "@/lib/analytics";

describe("summarizeProgress", () => {
  it("returns zeros for no rows", () => {
    expect(summarizeProgress([])).toEqual({
      modulesCompleted: 0,
      modulesInProgress: 0,
      avgCompletionPercent: 0,
    });
  });

  it("dedupes per module keeping the best progress row", () => {
    const rows = [
      { module_id: "m1", progress_percent: 40, is_completed: false, started_at: null, completed_at: null },
      { module_id: "m1", progress_percent: 100, is_completed: true, started_at: null, completed_at: "2026-11-01T10:00:00Z" },
      { module_id: "m2", progress_percent: 50, is_completed: false, started_at: null, completed_at: null },
    ];
    const s = summarizeProgress(rows);
    expect(s.modulesCompleted).toBe(1);
    expect(s.modulesInProgress).toBe(1);
    expect(s.avgCompletionPercent).toBe(75);
  });

  it("treats null percent as 0 and never invents progress", () => {
    const s = summarizeProgress([
      { module_id: "m1", progress_percent: null, is_completed: false, started_at: null, completed_at: null },
    ]);
    expect(s.modulesInProgress).toBe(0);
    expect(s.avgCompletionPercent).toBe(0);
  });
});

describe("summarizeQuizAttempts", () => {
  it("returns honest zeros for no attempts", () => {
    const s = summarizeQuizAttempts([]);
    expect(s.attempts).toBe(0);
    expect(s.passRate).toBe(0);
    expect(s.avgPercentage).toBe(0);
  });

  it("computes pass rate, average, best and points from real rows", () => {
    const rows = [
      { quiz_id: "q1", score: 8, percentage: 80, passed: true, total_points: 10, started_at: null, completed_at: null },
      { quiz_id: "q1", score: 4, percentage: 40, passed: false, total_points: 10, started_at: null, completed_at: null },
      { quiz_id: "q2", score: 10, percentage: 100, passed: true, total_points: 10, started_at: null, completed_at: null },
    ];
    const s = summarizeQuizAttempts(rows);
    expect(s.attempts).toBe(3);
    expect(s.passedAttempts).toBe(2);
    expect(s.passRate).toBe(67);
    expect(s.avgPercentage).toBe(73);
    expect(s.bestPercentage).toBe(100);
    expect(s.totalPointsEarned).toBe(22);
  });

  it("skips null percentages in the average", () => {
    const s = summarizeQuizAttempts([
      { quiz_id: "q1", score: null, percentage: null, passed: null, total_points: null, started_at: null, completed_at: null },
    ]);
    expect(s.avgPercentage).toBe(0);
    expect(s.passRate).toBe(0);
  });
});

describe("computeTrackProgress", () => {
  const tracks = [
    { id: "t1", name: "Frontend", icon: "code" },
    { id: "t2", name: "Backend", icon: "server" },
  ];
  const modules = [
    { id: "m1", track_id: "t1", is_published: true },
    { id: "m2", track_id: "t1", is_published: true },
    { id: "m3", track_id: "t1", is_published: false },
    { id: "m4", track_id: "t2", is_published: true },
  ];

  it("counts completed against published modules only", () => {
    const out = computeTrackProgress(["t1", "t2"], tracks, modules, [
      { module_id: "m1", progress_percent: 100, is_completed: true, started_at: null, completed_at: null },
      { module_id: "m3", progress_percent: 100, is_completed: true, started_at: null, completed_at: null },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ trackId: "t1", publishedModules: 2, completedModules: 1, percent: 50 });
    expect(out[1]).toMatchObject({ trackId: "t2", publishedModules: 1, completedModules: 0, percent: 0 });
  });

  it("handles tracks with no published modules", () => {
    const out = computeTrackProgress(["t2"], tracks, [], []);
    expect(out[0]).toMatchObject({ publishedModules: 0, completedModules: 0, percent: 0 });
  });
});

describe("activitySeries", () => {
  it("buckets completions and attempts by UTC day, oldest first", () => {
    const now = new Date("2026-11-17T12:00:00Z");
    const out = activitySeries(
      [
        { module_id: "m1", progress_percent: 100, is_completed: true, started_at: null, completed_at: "2026-11-16T09:00:00Z" },
        { module_id: "m2", progress_percent: 30, is_completed: false, started_at: null, completed_at: null },
      ],
      [
        { quiz_id: "q1", score: 5, percentage: 50, passed: false, total_points: 10, started_at: "2026-11-17T08:00:00Z", completed_at: null },
      ],
      3,
      now,
    );
    expect(out.map((d) => d.day)).toEqual(["2026-11-15", "2026-11-16", "2026-11-17"]);
    expect(out[0]).toMatchObject({ completions: 0, quizAttempts: 0 });
    expect(out[1]).toMatchObject({ completions: 1, quizAttempts: 0 });
    expect(out[2]).toMatchObject({ completions: 0, quizAttempts: 1 });
  });

  it("returns zero-filled days when there is no activity", () => {
    const out = activitySeries([], [], 7, new Date("2026-11-17T12:00:00Z"));
    expect(out).toHaveLength(7);
    expect(out.every((d) => d.completions === 0 && d.quizAttempts === 0)).toBe(true);
  });
});
