-- =============================================
-- FIX: Learning Sources RLS Policy
-- The original policy referenced profiles.role which doesn't exist
-- Roles are stored in user_roles table
-- =============================================

-- Drop the incorrect admin policy
DROP POLICY IF EXISTS "Allow admin full access" ON public.learning_sources;

-- Create correct admin policy using user_roles table
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
