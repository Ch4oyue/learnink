-- =============================================
-- STANDALONE SQL: Create missing tables for LearnInk
-- Run this directly in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. LEARNING SOURCES TABLE
-- =============================================

-- Create the learning_sources table if not exists
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

-- Enable RLS
ALTER TABLE public.learning_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access for active sources" ON public.learning_sources;
DROP POLICY IF EXISTS "Allow admin full access" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;

-- Allow public read for active sources (landing page)
CREATE POLICY "Allow public read access for active sources"
ON public.learning_sources
FOR SELECT
TO public
USING (is_active = true);

-- Allow admin to manage all sources
CREATE POLICY "Admin can manage learning_sources"
ON public.learning_sources
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_learning_sources_active 
ON public.learning_sources(is_active, display_order);

-- Insert sample data
INSERT INTO public.learning_sources (name, logo_url, website_url, category, display_order) VALUES
    ('freeCodeCamp', 'https://upload.wikimedia.org/wikipedia/commons/3/39/FreeCodeCamp_logo.png', 'https://freecodecamp.org', 'coding', 1),
    ('MDN Web Docs', 'https://upload.wikimedia.org/wikipedia/commons/9/98/MDN_Web_Docs.svg', 'https://developer.mozilla.org', 'documentation', 2),
    ('Khan Academy', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Khan_Academy_Logo_Old_version_2015.jpg', 'https://khanacademy.org', 'education', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. INTEGRATIONS TABLE
-- =============================================

-- Create the integrations table if not exists
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL DEFAULT 'custom',
    api_key_hash TEXT NOT NULL,
    api_key_preview TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    request_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;

-- Admin policy
CREATE POLICY "Admin can manage integrations"
ON public.integrations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_source ON public.integrations(source);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON public.integrations(is_active);

-- =============================================
-- 3. INCOMING CONTENTS TABLE (for n8n integration)
-- =============================================

CREATE TABLE IF NOT EXISTS public.incoming_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    raw_content JSONB NOT NULL DEFAULT '{}',
    source TEXT DEFAULT 'n8n',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    integration_id UUID REFERENCES public.integrations(id),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.incoming_contents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage incoming_contents" ON public.incoming_contents;

-- Admin policy
CREATE POLICY "Admin can manage incoming_contents"
ON public.incoming_contents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 4. GRANT SERVICE ROLE ACCESS (for Edge Functions)
-- =============================================
GRANT ALL ON public.integrations TO service_role;
GRANT ALL ON public.learning_sources TO service_role;
GRANT ALL ON public.incoming_contents TO service_role;

-- =============================================
-- DONE! All tables created
-- =============================================
SELECT 'Tables created successfully!' as status;
