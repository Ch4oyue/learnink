-- Create user_tracks table
CREATE TABLE IF NOT EXISTS public.user_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_tracks_user_id_track_id_key UNIQUE (user_id, track_id)
);

-- Enable RLS
ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own enrollments" ON public.user_tracks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.user_tracks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and Tutors can view all enrollments" ON public.user_tracks
    FOR SELECT USING (
        public.has_role('admin', auth.uid()) OR
        public.has_role('tutor', auth.uid())
    );

-- Function to get popular modules
CREATE OR REPLACE FUNCTION public.get_popular_modules(limit_count int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  level text,
  category text,
  student_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    m.id,
    m.title,
    m.summary,
    m.level,
    m.category,
    count(distinct up.user_id) as student_count
  FROM modules m
  LEFT JOIN user_progress up ON m.id = up.module_id
  GROUP BY m.id
  ORDER BY student_count DESC
  LIMIT limit_count;
$$;
