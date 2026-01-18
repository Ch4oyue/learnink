-- =============================================
-- Migration: Create incoming_contents table
-- Purpose: Store incoming content from n8n workflow for admin review
-- =============================================

-- Enable extension for UUID (usually already enabled, but explicit is safer)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enum for content status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Create Table
CREATE TABLE IF NOT EXISTS public.incoming_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    raw_content JSONB DEFAULT '{}'::jsonb,
    source TEXT DEFAULT 'n8n',
    status content_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id)
);

-- Add comment for documentation
COMMENT ON TABLE public.incoming_contents IS 'Incoming content from n8n workflow pending admin review';

-- Create index for faster pending content queries
CREATE INDEX IF NOT EXISTS idx_incoming_contents_status 
ON public.incoming_contents(status);

CREATE INDEX IF NOT EXISTS idx_incoming_contents_created_at 
ON public.incoming_contents(created_at DESC);

-- Enable RLS
ALTER TABLE public.incoming_contents ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can INSERT (for Edge Function from n8n)
-- This is handled automatically by Supabase - service_role bypasses RLS

-- Policy: Admin can SELECT all records
CREATE POLICY "Admin can select incoming contents"
ON public.incoming_contents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Policy: Admin can UPDATE records (for approve/reject)
CREATE POLICY "Admin can update incoming contents"
ON public.incoming_contents
FOR UPDATE
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

-- Policy: Admin can DELETE records
CREATE POLICY "Admin can delete incoming contents"
ON public.incoming_contents
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);
