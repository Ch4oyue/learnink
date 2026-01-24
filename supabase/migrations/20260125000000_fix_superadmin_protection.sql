-- =============================================
-- Fix Super Admin Protection
-- Created: 2026-01-25
-- Purpose: Robustly protect 'agen.salva@gmail.com' from being downgraded, regardless of current role.
-- =============================================

-- 1. Create robust protection function
CREATE OR REPLACE FUNCTION protect_super_admin_role_change()
RETURNS TRIGGER AS $$
DECLARE
  target_super_email TEXT := 'agen.salva@gmail.com';
  is_target_user BOOLEAN;
BEGIN
  -- Check if the modified user_id matches the Super Admin email
  -- We use EXISTS to avoid strict permission issues if possible,
  -- but usually we can read auth.users in security definer functions or migrations
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = target_super_email
    AND id = OLD.user_id
  ) INTO is_target_user;

  -- Logic 1: If it IS the specific Super Admin user
  IF is_target_user THEN
    IF NEW.role != 'superadmin' THEN
      RAISE EXCEPTION '❌ ABORT: You cannot downgrade the Super Admin (% )!', target_super_email;
    END IF;
  END IF;

  -- Logic 2: If the user ALREADY has superadmin role (generic protection)
  IF OLD.role = 'superadmin' THEN
    IF NEW.role != 'superadmin' THEN
       RAISE EXCEPTION '❌ ABORT: Super Admin role cannot be downgraded!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach Trigger to user_roles
DROP TRIGGER IF EXISTS protect_super_admin_role_trigger ON user_roles;
-- Note: We use the new function name to avoid conflicts/ambiguity with old 'protect_super_admin'
CREATE TRIGGER protect_super_admin_role_trigger
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin_role_change();

-- 3. Force-fix the role for the Super Admin now
DO $$
DECLARE
  target_email TEXT := 'agen.salva@gmail.com';
  target_uid UUID;
BEGIN
  SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

  IF target_uid IS NOT NULL THEN
    -- Upsert ensuring role is superadmin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_uid, 'superadmin')
    ON CONFLICT (user_id)
    DO UPDATE SET role = 'superadmin';

    RAISE NOTICE '✅ Forced % to superadmin role.', target_email;
  ELSE
    RAISE NOTICE '⚠️ User % not found. Skipping role update.', target_email;
  END IF;
END $$;
