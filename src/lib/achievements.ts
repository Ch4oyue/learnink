// Milestones derived only from the user's real learning numbers.
// Each milestone is a fixed rule over existing data; nothing is stored or invented.

export interface AchievementInput {
  modulesCompleted: number;
  passedQuizzes: number;
  bestQuizPercentage: number;
  currentStreak: number;
  points: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unlocked: boolean;
}

const RULES: Array<{
  id: string;
  title: string;
  description: string;
  target: number;
  value: (i: AchievementInput) => number;
}> = [
  { id: "first-module", title: "First step", description: "Complete your first module", target: 1, value: (i) => i.modulesCompleted },
  { id: "five-modules", title: "Getting going", description: "Complete 5 modules", target: 5, value: (i) => i.modulesCompleted },
  { id: "ten-modules", title: "Committed", description: "Complete 10 modules", target: 10, value: (i) => i.modulesCompleted },
  { id: "first-quiz", title: "Quiz taker", description: "Pass your first quiz", target: 1, value: (i) => i.passedQuizzes },
  { id: "five-quizzes", title: "Sharp mind", description: "Pass 5 quizzes", target: 5, value: (i) => i.passedQuizzes },
  { id: "perfect-quiz", title: "Perfect score", description: "Score 100% on a quiz", target: 100, value: (i) => i.bestQuizPercentage },
  { id: "streak-3", title: "On a roll", description: "Learn 3 days in a row", target: 3, value: (i) => i.currentStreak },
  { id: "streak-7", title: "One full week", description: "Learn 7 days in a row", target: 7, value: (i) => i.currentStreak },
  { id: "points-500", title: "Point collector", description: "Earn 500 points", target: 500, value: (i) => i.points },
];

export function computeMilestones(input: AchievementInput): Milestone[] {
  return RULES.map((r) => {
    const raw = Math.max(0, r.value(input));
    const current = Math.min(raw, r.target);
    return { id: r.id, title: r.title, description: r.description, current, target: r.target, unlocked: raw >= r.target };
  });
}
