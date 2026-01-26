-- Fix All RPCs and Roles (Super Admin & Stats)
-- Created: 2026-02-02
-- Purpose: Consolidates all fixes for Roles, Super Admin, and Missing RPCs (404 errors)
-- UPDATED: Includes fix for 'prevent_moderator_role' constraint

-- 1. Ensure 'superadmin' exists in app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Remove the restrictive constraint that blocks superadmin
-- This constraint was originally added to prevent 'moderator' but it hardcoded allowed roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS prevent_moderator_role;

-- 3. Downgrade Moderators to User (Clean up deprecated role)
UPDATE public.user_roles
SET role = 'user'
WHERE role = 'moderator';

-- 4. Assign Super Admin to agen.salva@gmail.com
DO $$
DECLARE
  target_email TEXT := 'agen.salva@gmail.com';
  target_uid UUID;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Delete existing roles first to avoid unique constraint issues
    DELETE FROM public.user_roles WHERE user_id = target_uid;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_uid, 'superadmin');

    RAISE NOTICE 'Updated % to superadmin', target_email;
  ELSE
    RAISE NOTICE 'User % not found, skipping update', target_email;
  END IF;
END $$;

-- 5. Re-create get_user_auth_data RPC (Fixes "Everyone is User" and 404s)
CREATE OR REPLACE FUNCTION get_user_auth_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_profile jsonb;
  v_tracks text[];
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();

  -- Security check
  IF v_current_user_id IS NOT NULL AND v_current_user_id != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: You can only access your own auth data.';
  END IF;

  -- Select role safely
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  -- Select profile
  SELECT jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'avatar_url', avatar_url
  ) INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Select enrolled tracks
  SELECT COALESCE(array_agg(track_id::text), ARRAY[]::text[])
  INTO v_tracks
  FROM user_tracks WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'role', v_role,
    'profile', v_profile,
    'enrolled_tracks', v_tracks
  );
END;
$$;

-- Grant permissions for get_user_auth_data
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO service_role;

-- 6. Re-create get_user_learning_stats RPC (Fixes stats 404s)
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

-- Grant permissions for get_user_learning_stats
GRANT EXECUTE ON FUNCTION get_user_learning_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_learning_stats(uuid) TO service_role;

-- 7. Update has_role to support Super Admin hierarchy
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  IF user_role = 'superadmin' THEN
    RETURN true;
  END IF;

  IF _role = 'admin' AND user_role = 'superadmin' THEN RETURN true; END IF;

  RETURN user_role = _role;
END;
$$;
