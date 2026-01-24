-- =============================================
-- Migration: Refactor Schema for LearnInk v2
-- Purpose: Add tracks, module status, and user_notes
-- Date: 2026-01-22
-- =============================================

-- =============================================
-- 1. CREATE TRACKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'Folder',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tracks IS 'Learning tracks/clusters (e.g., The Specialist, Life OS)';

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_tracks_display_order ON public.tracks(display_order);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Everyone can read active tracks
CREATE POLICY "Anyone can view active tracks"
ON public.tracks FOR SELECT
USING (is_active = true);

-- Admin can manage tracks
CREATE POLICY "Admin can manage tracks"
ON public.tracks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default tracks
INSERT INTO public.tracks (name, slug, description, icon, display_order) VALUES
    ('The Specialist', 'specialist', 'Core technical skills: AI, Automation, Fullstack Development', 'Cpu', 1),
    ('Life OS', 'life-os', 'Supporting knowledge: Finance, Productivity, Relationships', 'Heart', 2)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 2. CREATE MODULE STATUS ENUM
-- =============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_status') THEN
        CREATE TYPE module_status AS ENUM ('mastered', 'exploring', 'queue');
    END IF;
END $$;

-- =============================================
-- 3. ALTER MODULES TABLE
-- =============================================
-- Add track_id column
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL;

-- Add status column (using TEXT for flexibility, can be constrained later)
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queue' 
CHECK (status IN ('mastered', 'exploring', 'queue'));

-- Add source_url column for original learning source
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index for track filtering
CREATE INDEX IF NOT EXISTS idx_modules_track_id ON public.modules(track_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);

-- =============================================
-- 4. CREATE USER NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

COMMENT ON TABLE public.user_notes IS 'User personal notes per module (Second Brain feature)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_module_id ON public.user_notes(module_id);

-- Enable RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notes
CREATE POLICY "Users can view own notes"
ON public.user_notes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can view public notes
CREATE POLICY "Anyone can view public notes"
ON public.user_notes FOR SELECT
USING (is_public = true);

-- Users can insert their own notes
CREATE POLICY "Users can insert own notes"
ON public.user_notes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.user_notes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON public.user_notes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- 5. ADD n8n_processed TO material_requests
-- =============================================
ALTER TABLE public.material_requests 
ADD COLUMN IF NOT EXISTS n8n_processed BOOLEAN DEFAULT false;

ALTER TABLE public.material_requests 
ADD COLUMN IF NOT EXISTS n8n_processed_at TIMESTAMPTZ;

-- =============================================
-- 6. TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tracks trigger
DROP TRIGGER IF EXISTS update_tracks_updated_at ON public.tracks;
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User notes trigger
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON public.user_notes;
CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON public.user_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. GRANT SERVICE ROLE ACCESS
-- =============================================
GRANT ALL ON public.tracks TO service_role;
GRANT ALL ON public.user_notes TO service_role;

-- =============================================
-- DONE!
-- =============================================
SELECT 'Schema refactor migration completed!' as status;
