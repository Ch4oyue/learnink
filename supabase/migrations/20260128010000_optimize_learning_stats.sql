-- Migration: Optimize Learning Stats
-- Purpose: Add missing indexes and optimize RPC function for performance
-- Date: 2026-01-28

-- 1. Create indexes to speed up lookups by user_id
-- These are critical for the aggregation queries to run in O(N) where N is user's history, not table size.
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_notes_user_id ON public.learning_notes(user_id);

-- Index for date range filtering on notes
CREATE INDEX IF NOT EXISTS idx_learning_notes_created_at ON public.learning_notes(created_at);

-- 2. Optimize the aggregation function
-- Uses CTEs to perform all aggregations in a single query context
CREATE OR REPLACE FUNCTION get_user_learning_stats(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    WITH progress_stats AS (
        SELECT
            COUNT(*) as total_started,
            COALESCE(SUM(CASE WHEN is_completed THEN 1 ELSE 0 END), 0) as total_completed,
            COALESCE(AVG(progress_percent), 0) as avg_progress
        FROM user_progress
        WHERE user_id = target_user_id
    ),
    quiz_stats AS (
        SELECT
            COUNT(*) as total_quizzes,
            COALESCE(SUM(CASE WHEN passed THEN 1 ELSE 0 END), 0) as total_passed,
            COALESCE(AVG(percentage), 0) as avg_score
        FROM user_quiz_attempts
        WHERE user_id = target_user_id
    ),
    note_stats AS (
        SELECT
            COUNT(*) as total_notes,
            COUNT(CASE WHEN created_at >= (NOW() - INTERVAL '7 days') THEN 1 END) as notes_week
        FROM learning_notes
        WHERE user_id = target_user_id
    )
    SELECT
        json_build_object(
            'totalModulesStarted', p.total_started,
            'completedModules', p.total_completed,
            'averageProgress', ROUND(p.avg_progress),
            'quizzesCompleted', q.total_quizzes,
            'quizzesPassed', q.total_passed,
            'averageQuizScore', ROUND(q.avg_score),
            'totalNotes', n.total_notes,
            'notesThisWeek', n.notes_week,
            'currentStreak', LEAST(7, p.total_completed + q.total_passed)
        )
    INTO result
    FROM progress_stats p
    CROSS JOIN quiz_stats q
    CROSS JOIN note_stats n;

    RETURN result;
END;
$$;
