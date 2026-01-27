-- =============================================
-- Migration: Fix Privilege Escalation
-- Purpose: Prevent Admins from promoting themselves or others to Super Admin
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_new_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set role to superadmin
  IF NEW.role = 'superadmin' THEN
    -- Allow if it's the service_role (e.g. seeds, migrations)
    -- We check the JWT role claim directly
    IF (NULLIF(current_setting('request.jwt.claim.role', true), '')::text = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- Check if the actor is a superadmin using the secure has_role function
    -- auth.uid() returns the current user's ID
    IF NOT public.has_role('superadmin', auth.uid()) THEN
        RAISE EXCEPTION '❌ ABORT: Only a Super Admin can appoint another Super Admin!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotency
DROP TRIGGER IF EXISTS prevent_super_admin_creation_trigger ON public.user_roles;

-- Create the trigger
CREATE TRIGGER prevent_super_admin_creation_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_new_super_admin();

-- Verification query (for documentation purposes)
SELECT '✅ Trigger prevent_super_admin_creation_trigger created successfully' as status;
