-- =============================================
-- Migration: Fix Missing user_tracks Table
-- Purpose: Create user_tracks table which failed to create previously due to dependency order
-- Date: 2026-01-30
-- =============================================

-- 1. Create user_tracks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT user_tracks_user_id_track_id_key UNIQUE (user_id, track_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Policy: Users can view their own enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_tracks;
CREATE POLICY "Users can view their own enrollments" ON public.user_tracks
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Policy: Users can enroll themselves (Insert)
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.user_tracks;
CREATE POLICY "Users can enroll themselves" ON public.user_tracks
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Admins can view all (Optional, useful for dashboards)
-- Using the boolean comparison for safety if has_role is complex
-- Assuming public.has_role(role, userid) exists as per context
-- If not sure, we can skip specific admin policy if not strictly needed now,
-- or use a simple exists check on a safe table.
-- For now, let's assume the basic user flow is the priority.

-- 4. Grant Permissions
GRANT ALL ON public.user_tracks TO service_role;
GRANT SELECT, INSERT, DELETE ON public.user_tracks TO authenticated;

-- 5. Add Index for Performance
CREATE INDEX IF NOT EXISTS idx_user_tracks_user_id ON public.user_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_track_id ON public.user_tracks(track_id);
