-- Fix Profiles RLS to prevent email leak
-- Date: 2026-01-24

-- Drop the permissive policy that allowed everyone to see emails
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policies

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Admins can view all profiles
-- Relies on the existing has_role function
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Note: We do not add a policy for Tutors to view all profiles as it's not currently required
-- and would expose student emails. If needed in future, use a secure View or RPC.
