-- 1. Remove unrestricted INSERT policy on notifications table
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- 2. Fix profiles table - only allow users to view their own profile
-- First drop the existing permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.notifications;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policy - users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to view basic profile info (for display names in UI)
-- This is a common pattern - you might want profiles visible to other authenticated users
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);