import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  summarizeProgress,
  summarizeQuizAttempts,
  computeTrackProgress,
  activitySeries,
  type ProgressRow,
  type QuizAttemptRow,
  type TrackRow,
  type ModuleRow,
} from "@/lib/analytics";

export interface AnalyticsData {
  progressRows: ProgressRow[];
  attemptRows: QuizAttemptRow[];
  summary: ReturnType<typeof summarizeProgress>;
  quiz: ReturnType<typeof summarizeQuizAttempts>;
  perTrack: ReturnType<typeof computeTrackProgress>;
  activity: ReturnType<typeof activitySeries>;
  recentCompletions: Array<{ moduleId: string; completedAt: string }>;
}

const ACTIVITY_DAYS = 14;

/**
 * Fetches the signed-in user's real learning data and aggregates it.
 * Every number on the Analytics page derives from these rows; when the
 * user has no data, the summaries are zero and the page shows empty states.
 */
export function useAnalytics(userId?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("userId required");

      const [progressRes, attemptsRes, userTracksRes] = await Promise.all([
        supabase
          .from("user_progress")
          .select("module_id, progress_percent, is_completed, started_at, completed_at")
          .eq("user_id", userId),
        supabase
          .from("user_quiz_attempts")
          .select("quiz_id, score, percentage, passed, total_points, started_at, completed_at")
          .eq("user_id", userId)
          .order("started_at", { ascending: false }),
        supabase.from("user_tracks").select("track_id").eq("user_id", userId),
      ]);

      if (progressRes.error) throw progressRes.error;
      if (attemptsRes.error) throw attemptsRes.error;
      if (userTracksRes.error) throw userTracksRes.error;

      const progressRows = (progressRes.data ?? []) as ProgressRow[];
      const attemptRows = (attemptsRes.data ?? []) as QuizAttemptRow[];
      const enrolledTrackIds = (userTracksRes.data ?? []).map((r) => r.track_id);

      let tracks: TrackRow[] = [];
      let modules: ModuleRow[] = [];
      if (enrolledTrackIds.length > 0) {
        const [tracksRes, modulesRes] = await Promise.all([
          supabase.from("tracks").select("id, name, icon").in("id", enrolledTrackIds),
          supabase
            .from("modules")
            .select("id, track_id, is_published")
            .in("track_id", enrolledTrackIds),
        ]);
        if (tracksRes.error) throw tracksRes.error;
        if (modulesRes.error) throw modulesRes.error;
        tracks = (tracksRes.data ?? []) as TrackRow[];
        modules = (modulesRes.data ?? []) as ModuleRow[];
      }

      return {
        progressRows,
        attemptRows,
        summary: summarizeProgress(progressRows),
        quiz: summarizeQuizAttempts(attemptRows),
        perTrack: computeTrackProgress(enrolledTrackIds, tracks, modules, progressRows),
        activity: activitySeries(progressRows, attemptRows, ACTIVITY_DAYS),
        recentCompletions: progressRows
          .filter((r) => r.is_completed && r.completed_at)
          .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
          .slice(0, 5)
          .map((r) => ({ moduleId: r.module_id, completedAt: r.completed_at as string })),
      };
    },
  });
}
