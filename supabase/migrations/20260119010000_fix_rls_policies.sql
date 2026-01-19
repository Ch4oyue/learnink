-- =============================================
-- FIX: Learning Sources RLS Policy
-- The original policy referenced profiles.role which doesn't exist
-- Roles are stored in user_roles table
-- FIXED: Split into public read + admin write policies
-- =============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow admin full access" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.learning_sources;

-- Policy 1: Public can read active learning sources (for landing page marquee)
CREATE POLICY "Enable read access for all users"
ON public.learning_sources
FOR SELECT
TO public
USING (is_active = true);

-- Policy 2: Admin can insert new learning sources
CREATE POLICY "Enable insert for admins only"
ON public.learning_sources
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- Policy 3: Admin can update learning sources
CREATE POLICY "Enable update for admins only"
ON public.learning_sources
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- Policy 4: Admin can delete learning sources
CREATE POLICY "Enable delete for admins only"
ON public.learning_sources
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- Also ensure the integrations table exists (in case migration wasn't run)
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

-- Enable RLS on integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate integrations policy to ensure it's correct
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;

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

-- Grant service role full access (for Edge Functions)
-- This allows the Edge Function to insert with service_role key
GRANT ALL ON public.integrations TO service_role;
GRANT ALL ON public.learning_sources TO service_role;
