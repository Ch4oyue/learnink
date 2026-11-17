// Pure aggregation helpers for the Analytics page.
// All functions operate on plain row arrays so they are unit-testable
// without Supabase. No fabricated values: empty input yields zeroed,
// honestly-empty summaries and the page renders empty states.

export interface ProgressRow {
  module_id: string;
  progress_percent: number | null;
  is_completed: boolean | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface QuizAttemptRow {
  quiz_id: string;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  total_points: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface TrackRow {
  id: string;
  name: string;
  icon: string | null;
}

export interface ModuleRow {
  id: string;
  track_id: string | null;
  is_published: boolean | null;
}

export interface ProgressSummary {
  modulesCompleted: number;
  modulesInProgress: number;
  avgCompletionPercent: number;
}

/** Collapse progress rows to one best row per module, then summarize. */
export function summarizeProgress(rows: ProgressRow[]): ProgressSummary {
  const bestByModule = new Map<string, ProgressRow>();
  for (const row of rows) {
    const existing = bestByModule.get(row.module_id);
    if (!existing || (row.progress_percent ?? 0) > (existing.progress_percent ?? 0)) {
      bestByModule.set(row.module_id, row);
    }
  }
  let completed = 0;
  let inProgress = 0;
  let percentSum = 0;
  for (const row of bestByModule.values()) {
    const pct = row.progress_percent ?? 0;
    percentSum += pct;
    if (row.is_completed) completed += 1;
    else if (pct > 0) inProgress += 1;
  }
  const total = bestByModule.size;
  return {
    modulesCompleted: completed,
    modulesInProgress: inProgress,
    avgCompletionPercent: total === 0 ? 0 : Math.round(percentSum / total),
  };
}

export interface QuizSummary {
  attempts: number;
  passedAttempts: number;
  passRate: number;
  avgPercentage: number;
  bestPercentage: number;
  totalPointsEarned: number;
}

export function summarizeQuizAttempts(rows: QuizAttemptRow[]): QuizSummary {
  const attempts = rows.length;
  if (attempts === 0) {
    return { attempts: 0, passedAttempts: 0, passRate: 0, avgPercentage: 0, bestPercentage: 0, totalPointsEarned: 0 };
  }
  let passed = 0;
  let pctSum = 0;
  let pctCount = 0;
  let best = 0;
  let points = 0;
  for (const row of rows) {
    if (row.passed) passed += 1;
    if (row.percentage != null) {
      pctSum += row.percentage;
      pctCount += 1;
      if (row.percentage > best) best = row.percentage;
    }
    points += row.score ?? 0;
  }
  return {
    attempts,
    passedAttempts: passed,
    passRate: Math.round((passed / attempts) * 100),
    avgPercentage: pctCount === 0 ? 0 : Math.round(pctSum / pctCount),
    bestPercentage: Math.round(best),
    totalPointsEarned: points,
  };
}

export interface TrackProgress {
  trackId: string;
  name: string;
  icon: string | null;
  publishedModules: number;
  completedModules: number;
  percent: number;
}

/** Per-enrolled-track completion: completed modules / published modules. */
export function computeTrackProgress(
  enrolledTrackIds: string[],
  tracks: TrackRow[],
  modules: ModuleRow[],
  progressRows: ProgressRow[],
): TrackProgress[] {
  const completedModuleIds = new Set(
    progressRows.filter((r) => r.is_completed).map((r) => r.module_id),
  );
  const publishedByTrack = new Map<string, number>();
  for (const m of modules) {
    if (m.is_published && m.track_id) {
      publishedByTrack.set(m.track_id, (publishedByTrack.get(m.track_id) ?? 0) + 1);
    }
  }
  const nameById = new Map(tracks.map((t) => [t.id, t]));
  return enrolledTrackIds.map((trackId) => {
    const track = nameById.get(trackId);
    const published = publishedByTrack.get(trackId) ?? 0;
    const trackModuleIds = new Set(
      modules.filter((m) => m.track_id === trackId && m.is_published).map((m) => m.id),
    );
    const completed = [...completedModuleIds].filter((id) => trackModuleIds.has(id)).length;
    return {
      trackId,
      name: track?.name ?? "Unknown track",
      icon: track?.icon ?? null,
      publishedModules: published,
      completedModules: completed,
      percent: published === 0 ? 0 : Math.round((completed / published) * 100),
    };
  });
}

export interface DayCount {
  /** YYYY-MM-DD (UTC) */
  day: string;
  completions: number;
  quizAttempts: number;
}

/** Per-day activity counts for the last `days` days, oldest first. */
export function activitySeries(
  progressRows: ProgressRow[],
  attemptRows: QuizAttemptRow[],
  days: number,
  now: Date = new Date(),
): DayCount[] {
  const out: DayCount[] = [];
  const byDay = new Map<string, DayCount>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const entry = { day: key, completions: 0, quizAttempts: 0 };
    byDay.set(key, entry);
    out.push(entry);
  }
  for (const row of progressRows) {
    if (!row.completed_at) continue;
    const key = new Date(row.completed_at).toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (entry) entry.completions += 1;
  }
  for (const row of attemptRows) {
    const ts = row.completed_at ?? row.started_at;
    if (!ts) continue;
    const key = new Date(ts).toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (entry) entry.quizAttempts += 1;
  }
  return out;
}
