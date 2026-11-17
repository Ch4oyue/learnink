import { describe, expect, test } from "bun:test";
import { computeMilestones } from "../src/lib/achievements";

const zero = { modulesCompleted: 0, passedQuizzes: 0, bestQuizPercentage: 0, currentStreak: 0, points: 0 };

describe("computeMilestones", () => {
  test("nothing unlocked on empty data", () => {
    const m = computeMilestones(zero);
    expect(m.every((x) => !x.unlocked && x.current === 0)).toBe(true);
  });
  test("unlocks by threshold and caps progress at target", () => {
    const m = computeMilestones({ ...zero, modulesCompleted: 7, passedQuizzes: 1, bestQuizPercentage: 100, currentStreak: 3, points: 245 });
    const by = Object.fromEntries(m.map((x) => [x.id, x]));
    expect(by["first-module"].unlocked).toBe(true);
    expect(by["five-modules"].unlocked).toBe(true);
    expect(by["ten-modules"]).toMatchObject({ unlocked: false, current: 7 });
    expect(by["first-quiz"].unlocked).toBe(true);
    expect(by["five-quizzes"]).toMatchObject({ unlocked: false, current: 1 });
    expect(by["perfect-quiz"].unlocked).toBe(true);
    expect(by["streak-3"].unlocked).toBe(true);
    expect(by["streak-7"]).toMatchObject({ unlocked: false, current: 3 });
    expect(by["points-500"]).toMatchObject({ unlocked: false, current: 245 });
  });
  test("negative input never yields negative progress", () => {
    expect(computeMilestones({ ...zero, points: -5 })[8].current).toBe(0);
  });
});
