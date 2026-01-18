-- =============================================
-- Migration: Create integrations table
-- Purpose: Store API keys and configuration for external integrations (n8n, Notion, etc.)
-- =============================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum for integration sources
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_source') THEN
        CREATE TYPE integration_source AS ENUM ('n8n', 'notion', 'chatgpt', 'zapier', 'custom');
    END IF;
END $$;

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    source integration_source NOT NULL DEFAULT 'custom',
    
    -- API Key (hashed with bcrypt, never stored plain)
    api_key_hash TEXT NOT NULL,
    api_key_preview TEXT NOT NULL,  -- "sk_live_••••••••x1a4"
    
    -- Webhook configuration
    webhook_url TEXT,
    
    -- Status & Usage
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    request_count INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.integrations IS 'API keys and configurations for external integrations (n8n, Notion, etc.)';
COMMENT ON COLUMN public.integrations.api_key_hash IS 'bcrypt hash of the API key - never store plain text';
COMMENT ON COLUMN public.integrations.api_key_preview IS 'Masked preview of the key for display purposes';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_source ON public.integrations(source);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON public.integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_created_by ON public.integrations(created_by);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
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

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION update_integrations_updated_at();

-- =============================================
-- Update incoming_contents to link to integration
-- =============================================

-- Add integration_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incoming_contents' 
        AND column_name = 'integration_id'
    ) THEN
        ALTER TABLE public.incoming_contents 
        ADD COLUMN integration_id UUID REFERENCES public.integrations(id);
    END IF;
END $$;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_incoming_contents_integration 
ON public.incoming_contents(integration_id);
