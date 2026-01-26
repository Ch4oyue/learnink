-- Fix Roles, Add Superadmin, and Repair RPC
-- Created: 2026-02-02

-- 1. Ensure 'superadmin' exists in app_role enum
-- Note: ALTER TYPE cannot run inside a transaction block in some environments.
-- If this fails, run it separately.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Downgrade Moderators to User
UPDATE public.user_roles
SET role = 'user'
WHERE role = 'moderator';

-- 3. Assign Super Admin to agen.salva@gmail.com
DO $$
DECLARE
  target_email TEXT := 'agen.salva@gmail.com';
  target_uid UUID;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Update existing role or insert if missing
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_uid, 'superadmin')
    ON CONFLICT (user_id)
    DO UPDATE SET role = 'superadmin';

    RAISE NOTICE 'Updated % to superadmin', target_email;
  ELSE
    RAISE NOTICE 'User % not found, skipping update', target_email;
  END IF;
END $$;

-- 4. Re-create get_user_auth_data RPC to ensure it works
-- This fixes the "Everyone is User" bug if the function was missing
CREATE OR REPLACE FUNCTION get_user_auth_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_profile jsonb;
  v_tracks text[];
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();

  -- Security check: users can only fetch their own auth data
  IF v_current_user_id IS NOT NULL AND v_current_user_id != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: You can only access your own auth data.';
  END IF;

  -- 1. Get Role
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id;
  -- Default to 'user' if no role found
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  -- 2. Get Profile
  SELECT jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'avatar_url', avatar_url
  ) INTO v_profile FROM profiles WHERE id = p_user_id;

  -- 3. Get Enrolled Tracks
  SELECT COALESCE(array_agg(track_id::text), ARRAY[]::text[])
  INTO v_tracks
  FROM user_tracks WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'role', v_role,
    'profile', v_profile,
    'enrolled_tracks', v_tracks
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO service_role;

-- 5. Update has_role to support Super Admin hierarchy
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id;

  -- Superadmin has access to everything
  IF user_role = 'superadmin' THEN
    RETURN true;
  END IF;

  -- Admin access checks
  IF _role = 'admin' AND user_role = 'superadmin' THEN RETURN true; END IF;

  -- Strict check for others
  RETURN user_role = _role;
END;
$$;
