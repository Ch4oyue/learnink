-- =============================================
-- Migration: Create learning_sources table
-- Purpose: Store curated learning sources for landing page display
-- =============================================

-- Create the learning_sources table
CREATE TABLE IF NOT EXISTS public.learning_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.learning_sources IS 'Curated learning sources displayed on landing page';

-- Create index for faster active sources query
CREATE INDEX IF NOT EXISTS idx_learning_sources_active 
ON public.learning_sources(is_active, display_order);

-- Enable RLS
ALTER TABLE public.learning_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active sources (for landing page)
CREATE POLICY "Allow public read access for active sources"
ON public.learning_sources
FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated users with admin role to manage sources
CREATE POLICY "Allow admin full access"
ON public.learning_sources
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Insert sample learning sources
INSERT INTO public.learning_sources (name, logo_url, website_url, category, display_order) VALUES
    ('freeCodeCamp', 'https://upload.wikimedia.org/wikipedia/commons/3/39/FreeCodeCamp_logo.png', 'https://freecodecamp.org', 'coding', 1),
    ('MDN Web Docs', 'https://upload.wikimedia.org/wikipedia/commons/9/98/MDN_Web_Docs.svg', 'https://developer.mozilla.org', 'documentation', 2),
    ('Coursera', 'https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg', 'https://coursera.org', 'courses', 3),
    ('Khan Academy', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Khan_Academy_Logo_Old_version_2015.jpg', 'https://khanacademy.org', 'education', 4),
    ('YouTube', 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', 'https://youtube.com', 'video', 5),
    ('Stack Overflow', 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Stack_Overflow_icon.svg', 'https://stackoverflow.com', 'community', 6),
    ('GitHub', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', 'https://github.com', 'code', 7),
    ('W3Schools', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/W3Schools_logo.svg', 'https://w3schools.com', 'tutorials', 8)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_learning_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_sources_updated_at
BEFORE UPDATE ON public.learning_sources
FOR EACH ROW
EXECUTE FUNCTION update_learning_sources_updated_at();
