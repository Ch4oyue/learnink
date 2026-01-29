-- =============================================
-- Migration: Fix User Management Access (Superadmin & Admin)
-- Date: 2026-02-10
-- Purpose:
-- 1. Ensure 'superadmin' role exists.
-- 2. Fix 'has_role' function to be robust, recursion-safe (SECURITY DEFINER), and support hierarchy.
-- 3. Update RLS policies on 'profiles' and 'user_roles' to explicitly allow management by admins.
-- =============================================

-- 1. Ensure Role Exists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Improved Helper Function (Hierarchy Support)
-- SECURITY DEFINER ensures it runs with owner privileges (bypassing RLS), preventing recursion.
CREATE OR REPLACE FUNCTION public.has_role(_required_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id;

  -- If user has no role, they have no privileges
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. SUPERADMIN: Has access to EVERYTHING
  IF user_role = 'superadmin' THEN
    RETURN TRUE;
  END IF;

  -- 2. ADMIN: Has access to Admin, Tutor, and User scopes
  IF user_role = 'admin' THEN
    IF _required_role IN ('admin', 'tutor', 'user') THEN RETURN TRUE; END IF;
  END IF;

  -- 3. TUTOR: Has access to Tutor and User scopes
  IF user_role = 'tutor' THEN
    IF _required_role IN ('tutor', 'user') THEN RETURN TRUE; END IF;
  END IF;

  -- 4. USER: Has access to User scope only
  IF user_role = 'user' THEN
    IF _required_role = 'user' THEN RETURN TRUE; END IF;
  END IF;

  -- Default: Exact match
  RETURN user_role = _required_role;
END;
$$;

-- Overload for convenience
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_required_role, _user_id);
$$;

-- Alias check_is_admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin', auth.uid());
$$;

-- 3. Update RLS Policies

-- === PROFILES ===
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_profiles" ON public.profiles;
-- Cleanup old policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow users to view themselves, OR Admins/Tutors/Superadmins to view ALL.
CREATE POLICY "view_profiles" ON public.profiles
FOR SELECT USING (
  id = auth.uid()
  OR (SELECT public.has_role('tutor', auth.uid()))
);

-- Allow users to update themselves, OR Admins/Superadmins to update ALL.
CREATE POLICY "update_profiles" ON public.profiles
FOR UPDATE USING (
  id = auth.uid()
  OR (SELECT public.has_role('admin', auth.uid()))
);

CREATE POLICY "insert_profiles" ON public.profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- === USER_ROLES ===
DROP POLICY IF EXISTS "view_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "manage_user_roles" ON public.user_roles;
-- Cleanup old policies
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Allow users to view their own role, OR Admins/Superadmins to view ALL.
CREATE POLICY "view_user_roles" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid()
  OR (SELECT public.has_role('admin', auth.uid()))
);

-- Allow Admins/Superadmins to manage roles (Insert/Update/Delete).
CREATE POLICY "manage_user_roles" ON public.user_roles
FOR ALL USING (
  (SELECT public.has_role('admin', auth.uid()))
);

-- === MODULES (Ensure Tutors/Admins can see unpublished) ===
DROP POLICY IF EXISTS "view_modules" ON public.modules;
DROP POLICY IF EXISTS "manage_modules" ON public.modules;

CREATE POLICY "view_modules" ON public.modules
FOR SELECT USING (
  is_published = true
  OR (SELECT public.has_role('tutor', auth.uid()))
);

CREATE POLICY "manage_modules" ON public.modules
FOR ALL USING (
  (SELECT public.has_role('tutor', auth.uid()))
);
