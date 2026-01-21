-- =============================================
-- FIX: PII Leak in Profiles Table
-- Vulnerability: profiles.email was visible to all users via RLS
-- Fix: Remove email column and use secure RPC for admin access
-- =============================================

-- 1. Drop the trigger and function that synced emails
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
DROP FUNCTION IF EXISTS public.sync_profile_email();

-- 2. Drop the email column from profiles
-- This immediately stops the leak
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
               AND table_name = 'profiles'
               AND column_name = 'email') THEN
        ALTER TABLE public.profiles DROP COLUMN email;
    END IF;
END $$;

-- 3. Create secure RPC for admins to fetch user data including email
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  email text,
  role app_role
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security Check: Only Admins can execute this
  -- We check public.user_roles directly to avoid recursion or schema issues
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.created_at,
    u.email::text,
    COALESCE(ur.role, 'user'::app_role) as role
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_for_admin() TO authenticated;
