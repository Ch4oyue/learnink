-- =============================================
-- Migration: Security Hardening & RLS Updates
-- Date: 2026-01-28
-- Purpose: Standardize RLS policies using public.has_role() and ensure strict access control
-- =============================================

-- =============================================
-- 1. INTEGRATIONS Table
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean slate (idempotency)
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;
DROP POLICY IF EXISTS "integrations_admin_all" ON public.integrations;

-- Create standardized Admin policy
-- Uses the optimized has_role() function which supports hierarchy (Super Admin > Admin)
CREATE POLICY "integrations_admin_all" ON public.integrations
FOR ALL
TO authenticated
USING (
  public.has_role('admin'::app_role, auth.uid())
)
WITH CHECK (
  public.has_role('admin'::app_role, auth.uid())
);

-- =============================================
-- 2. INCOMING_CONTENTS Table
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.incoming_contents ENABLE ROW LEVEL SECURITY;

-- Drop potential old policies
DROP POLICY IF EXISTS "incoming_contents_admin_all" ON public.incoming_contents;

-- Admin Policy: Full Access (View, Approve, Reject)
CREATE POLICY "incoming_contents_admin_all" ON public.incoming_contents
FOR ALL
TO authenticated
USING (
  public.has_role('admin'::app_role, auth.uid())
)
WITH CHECK (
  public.has_role('admin'::app_role, auth.uid())
);

-- Note: Edge Functions writing to this table use the SERVICE_ROLE_KEY,
-- which bypasses RLS, so no specific INSERT policy is needed for them.

-- =============================================
-- 3. LEARNING_SOURCES Table (Public Read, Admin Write)
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.learning_sources ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to standardise)
DROP POLICY IF EXISTS "learning_sources_read_public" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_write_admin" ON public.learning_sources;

-- Public Read Policy (Only active sources)
CREATE POLICY "learning_sources_read_public" ON public.learning_sources
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Admin Write Policy (All operations)
CREATE POLICY "learning_sources_write_admin" ON public.learning_sources
FOR ALL
TO authenticated
USING (
  public.has_role('admin'::app_role, auth.uid())
)
WITH CHECK (
  public.has_role('admin'::app_role, auth.uid())
);
