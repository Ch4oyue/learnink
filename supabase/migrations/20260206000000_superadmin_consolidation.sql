-- =============================================
-- Migration: Super Admin Permissions Consolidation & Cleanup
-- Date: 2026-02-06
-- Purpose:
-- 1. Ensure 'superadmin' role exists and is fully integrated.
-- 2. Redefine `has_role` to enforce hierarchy (Superadmin > Admin > Tutor).
-- 3. Clean up (DROP) all existing policies on core tables to remove conflicts.
-- 4. Re-apply standardized policies that guarantee Superadmin access.
-- =============================================

-- ---------------------------------------------
-- 1. Ensure Enum Exists
-- ---------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ---------------------------------------------
-- 2. Redefine Helper Functions (Hierarchy Support)
-- ---------------------------------------------

-- Core function: Check if user has AT LEAST the required role privileges
-- Hierarchy: superadmin > admin > tutor > user
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

  -- If user has no role, they have no privileges (except maybe 'user' if we default it, but let's be strict)
  IF user_role IS NULL THEN
    -- If asking for 'user' role and they exist in auth.users, maybe?
    -- But for app logic, we expect a user_role entry.
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

  -- Default: Fallback to exact match (should cover any edge cases)
  RETURN user_role = _required_role;
END;
$$;

-- Overload for convenience (user_id first)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _required_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_required_role, _user_id);
$$;

-- Alias check_is_admin to has_role('admin') for backward compatibility
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin', auth.uid());
$$;


-- ---------------------------------------------
-- 3. MASSIVE CLEANUP (Drop Policies)
-- ---------------------------------------------

-- Helper macro to drop all policies on a table
DO $$
DECLARE
  tables text[] := ARRAY[
    'incoming_contents',
    'material_requests',
    'modules',
    'profiles',
    'user_roles',
    'integrations',
    'learning_sources',
    'module_categories',
    'module_levels',
    'tracks',
    'notifications'
  ];
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;


-- ---------------------------------------------
-- 4. APPLY STANDARDIZED POLICIES
-- ---------------------------------------------

-- === A. INCOMING_CONTENTS (Admin/Superadmin Only) ===
-- Fixes: "Unified Inbox" visibility for Superadmin
CREATE POLICY "admin_select_incoming_contents" ON public.incoming_contents
FOR SELECT USING ( public.has_role('admin', auth.uid()) );

CREATE POLICY "admin_insert_incoming_contents" ON public.incoming_contents
FOR INSERT WITH CHECK ( public.has_role('admin', auth.uid()) );

CREATE POLICY "admin_update_incoming_contents" ON public.incoming_contents
FOR UPDATE USING ( public.has_role('admin', auth.uid()) );

CREATE POLICY "admin_delete_incoming_contents" ON public.incoming_contents
FOR DELETE USING ( public.has_role('admin', auth.uid()) );


-- === B. MATERIAL_REQUESTS (Tutor/Admin/Superadmin Manage, User Own) ===
-- Fixes: "User Requests" visibility for Superadmin
CREATE POLICY "view_material_requests" ON public.material_requests
FOR SELECT USING (
  user_id = auth.uid() OR public.has_role('tutor', auth.uid())
);

CREATE POLICY "insert_material_requests" ON public.material_requests
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "update_material_requests" ON public.material_requests
FOR UPDATE USING (
  public.has_role('tutor', auth.uid())
);

-- Note: No delete policy usually, but if needed:
CREATE POLICY "delete_material_requests" ON public.material_requests
FOR DELETE USING (
  public.has_role('admin', auth.uid())
);


-- === C. MODULES (Public/Published, Tutor/Admin Manage) ===
CREATE POLICY "view_modules" ON public.modules
FOR SELECT USING (
  is_published = true OR public.has_role('tutor', auth.uid())
);

CREATE POLICY "manage_modules" ON public.modules
FOR ALL USING (
  public.has_role('tutor', auth.uid())
);


-- === D. PROFILES (Owner, Admin/Superadmin Manage All, Tutor View All) ===
CREATE POLICY "view_profiles" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR public.has_role('tutor', auth.uid())
);

CREATE POLICY "update_profiles" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR public.has_role('admin', auth.uid())
);

CREATE POLICY "insert_profiles" ON public.profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);


-- === E. USER_ROLES (Admin/Superadmin Manage) ===
CREATE POLICY "view_user_roles" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid() OR public.has_role('admin', auth.uid())
);

CREATE POLICY "manage_user_roles" ON public.user_roles
FOR ALL USING (
  public.has_role('admin', auth.uid())
);


-- === F. INTEGRATIONS & LEARNING_SOURCES (Admin/Superadmin Only) ===
CREATE POLICY "manage_integrations" ON public.integrations
FOR ALL USING ( public.has_role('admin', auth.uid()) );

CREATE POLICY "view_learning_sources" ON public.learning_sources
FOR SELECT USING ( is_active = true OR public.has_role('admin', auth.uid()) );

CREATE POLICY "manage_learning_sources" ON public.learning_sources
FOR ALL USING ( public.has_role('admin', auth.uid()) ); -- Covers INSERT/UPDATE/DELETE, overrides SELECT for admins


-- === G. TAXONOMY (Categories, Levels, Tracks) ===
-- Categories
CREATE POLICY "view_categories" ON public.module_categories FOR SELECT USING (true);
CREATE POLICY "manage_categories" ON public.module_categories FOR ALL USING ( public.has_role('admin', auth.uid()) );

-- Levels
CREATE POLICY "view_levels" ON public.module_levels FOR SELECT USING (true);
CREATE POLICY "manage_levels" ON public.module_levels FOR ALL USING ( public.has_role('admin', auth.uid()) );

-- Tracks
CREATE POLICY "view_tracks" ON public.tracks FOR SELECT USING ( is_active = true OR public.has_role('admin', auth.uid()) );
CREATE POLICY "manage_tracks" ON public.tracks FOR ALL USING ( public.has_role('admin', auth.uid()) );


-- === H. NOTIFICATIONS ===
CREATE POLICY "view_notifications" ON public.notifications
FOR SELECT USING ( user_id = auth.uid() );

CREATE POLICY "update_notifications" ON public.notifications
FOR UPDATE USING ( user_id = auth.uid() );

CREATE POLICY "insert_notifications_system" ON public.notifications
FOR INSERT WITH CHECK ( public.has_role('tutor', auth.uid()) );


-- ---------------------------------------------
-- 5. SAFETY TRIGGERS (Re-verify)
-- ---------------------------------------------
-- Ensure Super Admin cannot be deleted or downgraded

CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing FROM superadmin
  IF OLD.role = 'superadmin' AND NEW.role != 'superadmin' THEN
     RAISE EXCEPTION '❌ ABORT: Super Admin role cannot be changed or downgraded!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.user_roles;
CREATE TRIGGER protect_super_admin_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin();


CREATE OR REPLACE FUNCTION prevent_super_admin_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'superadmin' THEN
    RAISE EXCEPTION '❌ ABORT: You cannot delete the Super Admin role!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_super_admin_delete_trigger ON public.user_roles;
CREATE TRIGGER prevent_super_admin_delete_trigger
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_delete();


-- =============================================
-- FINAL VERIFICATION
-- =============================================
SELECT '✅ Super Admin cleanup and consolidation complete.' as status;
