-- =============================================
-- FIX: Notifications RLS Vulnerability
-- Vulnerability: "System can create notifications" policy allowed ANY authenticated user to insert.
-- Fix: Restrict INSERT to Admins only (using check_is_admin() for caching).
--      Service Role (Edge Functions) bypasses RLS, so it still works.
-- =============================================

-- Drop the permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create restrictive policy for Admins
-- We use (select public.check_is_admin()) to wrap the stable function for plan caching
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK ((select public.check_is_admin()));
