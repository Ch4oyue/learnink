-- =============================================
-- Super Admin Protection Trigger
-- Created: 2026-01-20
-- Purpose: Prevent role changes for Super Admin (agen.salva@gmail.com)
-- =============================================

-- 1. Function to prevent downgrade
CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Target: agen.salva@gmail.com
  IF OLD.id IN (SELECT id FROM auth.users WHERE email = 'agen.salva@gmail.com') THEN
    IF NEW.role != 'admin' THEN
      RAISE EXCEPTION '❌ ABORT: You cannot change the role of the Super Admin!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach Trigger to profiles table
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON profiles;
CREATE TRIGGER protect_super_admin_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin();

-- 3. Also protect user_roles table (where role is actually stored)
DROP TRIGGER IF EXISTS protect_super_admin_role_trigger ON user_roles;
CREATE TRIGGER protect_super_admin_role_trigger
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin();

-- 4. Prevent deletion of super admin role
CREATE OR REPLACE FUNCTION prevent_super_admin_role_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IN (SELECT id FROM auth.users WHERE email = 'agen.salva@gmail.com') THEN
    RAISE EXCEPTION '❌ ABORT: You cannot delete the role of the Super Admin!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_super_admin_role_delete_trigger ON user_roles;
CREATE TRIGGER prevent_super_admin_role_delete_trigger
BEFORE DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_role_delete();

-- =============================================
-- DONE
-- =============================================
SELECT '✅ Super Admin protection triggers created successfully!' as status;
