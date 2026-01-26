-- Fix Roles, Add Superadmin, and Repair RPC
-- Created: 2026-02-02
-- Fixed by Agent to resolve ON CONFLICT error

-- 1. Ensure 'superadmin' exists in app_role enum
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
    -- Delete existing roles first to avoid unique constraint issues if user_id is not unique key
    -- This enforces the "single role" logic required by the RPCs
    DELETE FROM public.user_roles WHERE user_id = target_uid;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_uid, 'superadmin');

    RAISE NOTICE 'Updated % to superadmin', target_email;
  ELSE
    RAISE NOTICE 'User % not found, skipping update', target_email;
  END IF;
END $$;

-- 4. Re-create get_user_auth_data RPC to ensure it works
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

  IF v_current_user_id IS NOT NULL AND v_current_user_id != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: You can only access your own auth data.';
  END IF;

  -- Select role safely. If multiple exist (which shouldn't happen with our cleanup), take one.
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  SELECT jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'avatar_url', avatar_url
  ) INTO v_profile FROM profiles WHERE id = p_user_id;

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
  WHERE user_id = _user_id
  LIMIT 1;

  IF user_role = 'superadmin' THEN
    RETURN true;
  END IF;

  IF _role = 'admin' AND user_role = 'superadmin' THEN RETURN true; END IF;

  RETURN user_role = _role;
END;
$$;
