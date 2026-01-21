import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPES
// ============================================

export interface LearningStats {
    // Module Stats
    totalModulesStarted: number;
    completedModules: number;
    averageProgress: number;

    // Quiz Stats
    quizzesCompleted: number;
    quizzesPassed: number;
    averageQuizScore: number;

    // Notes Stats
    totalNotes: number;
    notesThisWeek: number;

    // Streak (placeholder - would need daily login tracking)
    currentStreak: number;
}

// ============================================
// FETCH HELPER
// ============================================

async function fetchLearningStats(userId: string): Promise<LearningStats> {
    // Parallel fetch for performance
    const [progressRes, quizRes, notesRes, notesWeekRes] = await Promise.all([
        // User Progress Stats
        supabase
            .from("user_progress")
            .select("progress_percent, is_completed")
            .eq("user_id", userId),

        // Quiz Attempts Stats
        supabase
            .from("user_quiz_attempts")
            .select("score, percentage, passed")
            .eq("user_id", userId),

        // Total Notes
        supabase
            .from("learning_notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),

        // Notes this week
        supabase
            .from("learning_notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Process User Progress
    const progressData = progressRes.data || [];
    const totalModulesStarted = progressData.length;
    const completedModules = progressData.filter((p) => p.is_completed).length;
    const averageProgress =
        progressData.length > 0
            ? Math.round(
                progressData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) /
                progressData.length
            )
            : 0;

    // Process Quiz Stats
    const quizData = quizRes.data || [];
    const quizzesCompleted = quizData.length;
    const quizzesPassed = quizData.filter((q) => q.passed).length;
    const averageQuizScore =
        quizData.length > 0
            ? Math.round(
                quizData.reduce((sum, q) => sum + (q.percentage || 0), 0) /
                quizData.length
            )
            : 0;

    // Notes Stats
    const totalNotes = notesRes.count || 0;
    const notesThisWeek = notesWeekRes.count || 0;

    // Streak placeholder (would need daily login tracking table)
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
}

// ============================================
// HOOK
// ============================================

export function useLearningStats(userId?: string) {
    return useQuery({
        queryKey: ["learning-stats", userId],
        queryFn: () => fetchLearningStats(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
