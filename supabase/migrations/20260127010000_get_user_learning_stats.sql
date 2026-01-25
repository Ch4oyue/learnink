-- Function to aggregate user learning stats on the server side
-- Replaces multiple client-side queries with a single RPC call

CREATE OR REPLACE FUNCTION get_user_learning_stats(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    _total_modules_started int;
    _completed_modules int;
    _average_progress numeric;
    _quizzes_completed int;
    _quizzes_passed int;
    _average_quiz_score numeric;
    _total_notes int;
    _notes_this_week int;
    _current_streak int;
BEGIN
    -- Progress Stats
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN is_completed THEN 1 ELSE 0 END), 0),
        COALESCE(AVG(progress_percent), 0)
    INTO
        _total_modules_started,
        _completed_modules,
        _average_progress
    FROM user_progress
    WHERE user_id = target_user_id;

    -- Quiz Stats
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN passed THEN 1 ELSE 0 END), 0),
        COALESCE(AVG(percentage), 0)
    INTO
        _quizzes_completed,
        _quizzes_passed,
        _average_quiz_score
    FROM user_quiz_attempts
    WHERE user_id = target_user_id;

    -- Notes Stats
    SELECT COUNT(*) INTO _total_notes
    FROM learning_notes
    WHERE user_id = target_user_id;

    SELECT COUNT(*) INTO _notes_this_week
    FROM learning_notes
    WHERE user_id = target_user_id
    AND created_at >= (NOW() - INTERVAL '7 days');

    -- Streak Calculation
    -- Logic: min(7, completed_modules + quizzes_passed)
    -- This matches the legacy client-side implementation.
    _current_streak := LEAST(7, _completed_modules + _quizzes_passed);

    -- Construct JSON response
    result := json_build_object(
        'totalModulesStarted', _total_modules_started,
        'completedModules', _completed_modules,
        'averageProgress', ROUND(_average_progress),
        'quizzesCompleted', _quizzes_completed,
        'quizzesPassed', _quizzes_passed,
        'averageQuizScore', ROUND(_average_quiz_score),
        'totalNotes', _total_notes,
        'notesThisWeek', _notes_this_week,
        'currentStreak', _current_streak
    );

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_learning_stats(uuid) TO authenticated;
