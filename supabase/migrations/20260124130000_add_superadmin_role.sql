-- =============================================
-- Add Super Admin Role and Protection
-- Created: 2026-01-24
-- Purpose: Introduce 'superadmin' role and enforce immutability
-- =============================================

-- 1. Add 'superadmin' to app_role enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some Postgres versions/clients,
-- but typically works in Supabase migrations. If it fails, it needs to be run separately.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Update specific user to superadmin
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

-- 3. Update Protection Trigger (Prevent modifying Super Admin)
CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user being modified IS a superadmin (OLD role)
  -- Or if they are becoming a superadmin (NEW role) - we allow becoming one, but verify rules.

  -- Prevent downgrading FROM superadmin
  IF OLD.role = 'superadmin' THEN
    IF NEW.role != 'superadmin' THEN
       RAISE EXCEPTION '❌ ABORT: Super Admin role cannot be changed or downgraded!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger (ensure it exists)
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON user_roles;
CREATE TRIGGER protect_super_admin_trigger
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin();

-- 4. Prevent Deletion of Super Admin Role
CREATE OR REPLACE FUNCTION prevent_super_admin_role_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'superadmin' THEN
    RAISE EXCEPTION '❌ ABORT: You cannot delete the Super Admin role!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_super_admin_role_delete_trigger ON user_roles;
CREATE TRIGGER prevent_super_admin_role_delete_trigger
BEFORE DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_role_delete();

-- 5. Update has_role function to include superadmin capabilities
-- (Assuming has_role checks if user has AT LEAST this role or IS this role)
-- Let's verify and update has_role to ensure superadmin has access to everything admin has.
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

  -- Admin has access to moderator/tutor/user things?
  -- Usually strict equality is used in app code, but for RLS sometimes hierarchy is good.
  -- Current usage seems to be strict equality in some places, but let's see.
  -- If the app code asks `has_role('admin')`, superadmin should return true.

  IF _role = 'admin' AND user_role = 'superadmin' THEN RETURN true; END IF;
  IF _role = 'moderator' AND (user_role = 'admin' OR user_role = 'superadmin') THEN RETURN true; END IF;

  -- Default strict check
  RETURN user_role = _role;
END;
$$;
