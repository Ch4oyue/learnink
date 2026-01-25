-- Function to fetch all auth-related data (role, profile, tracks) in one go
-- Optimizes network performance by reducing 3 round-trips to 1 RPC call
-- Created: 2026-02-01

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
  -- We allow service_role (superuser) to bypass this check implicitly if needed,
  -- but standard users must match.
  IF v_current_user_id IS NOT NULL AND v_current_user_id != p_user_id THEN
     RAISE EXCEPTION 'Unauthorized: You can only access your own auth data.';
  END IF;

  -- 1. Get Role
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id;
  -- Default to 'user' if no role found
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  -- 2. Get Profile
  -- Only select necessary columns: id, display_name, avatar_url
  SELECT jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'avatar_url', avatar_url
  ) INTO v_profile FROM profiles WHERE id = p_user_id;

  -- 3. Get Enrolled Tracks
  -- track_id is likely uuid, cast to text to match return type
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_data(uuid) TO service_role;
