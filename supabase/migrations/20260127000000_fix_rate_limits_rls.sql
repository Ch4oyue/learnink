-- =============================================
-- Fix RLS Enabled No Policy for rate_limits
-- Purpose: Allow admins to view rate limits (auditing)
-- Date: 2026-01-27
-- =============================================

-- Drop policy if it exists to allow idempotency
DROP POLICY IF EXISTS "rate_limits_admin_select" ON public.rate_limits;

-- Create policy allowing admins (and superadmins via hierarchy) to view rate limits
CREATE POLICY "rate_limits_admin_select" ON public.rate_limits
FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role, auth.uid())
);
