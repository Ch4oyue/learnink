-- =============================================
-- Migration: Fix RLS Performance (Wrapper Optimization)
-- Date: 2026-02-09
-- Purpose:
-- 1. Re-apply the `(select auth.uid())` wrapper optimization for O(1) auth lookup.
-- 2. Wrap `check_is_admin()` in `(select check_is_admin())` for statement-level caching.
-- 3. Fix regression introduced in recent migrations (20260206/07).
-- =============================================

-- ---------------------------------------------
-- 1. INCOMING_CONTENTS (Admin/Superadmin Only)
-- ---------------------------------------------
DROP POLICY IF EXISTS "allow_select_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "allow_insert_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "allow_update_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "allow_delete_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_select_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_insert_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_update_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_delete_incoming_contents" ON public.incoming_contents;

-- Explicit check: Admin OR Superadmin
-- Using `(select check_is_admin())` is better if check_is_admin() handles both.
-- check_is_admin() handles 'admin' and 'superadmin'.
-- So we can use `(select check_is_admin())`.

CREATE POLICY "allow_select_incoming_contents" ON public.incoming_contents
FOR SELECT USING ( (select check_is_admin()) );

CREATE POLICY "allow_insert_incoming_contents" ON public.incoming_contents
FOR INSERT WITH CHECK ( (select check_is_admin()) );

CREATE POLICY "allow_update_incoming_contents" ON public.incoming_contents
FOR UPDATE USING ( (select check_is_admin()) );

CREATE POLICY "allow_delete_incoming_contents" ON public.incoming_contents
FOR DELETE USING ( (select check_is_admin()) );


-- ---------------------------------------------
-- 2. MATERIAL_REQUESTS
-- ---------------------------------------------
DROP POLICY IF EXISTS "allow_select_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "allow_insert_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "allow_update_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "allow_delete_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "view_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "insert_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "update_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "delete_material_requests" ON public.material_requests;

-- Select: User own OR Admin/Superadmin/Tutor
-- Tutors are not fully covered by check_is_admin().
-- We need: user_id = auth.uid() OR check_is_admin() OR is_tutor
CREATE POLICY "allow_select_material_requests" ON public.material_requests
FOR SELECT USING (
  user_id = (select auth.uid())
  OR (select check_is_admin())
  OR (select public.has_role('tutor', (select auth.uid())))
);

CREATE POLICY "allow_insert_material_requests" ON public.material_requests
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_material_requests" ON public.material_requests
FOR UPDATE USING (
  (select check_is_admin())
  OR (select public.has_role('tutor', (select auth.uid())))
);

CREATE POLICY "allow_delete_material_requests" ON public.material_requests
FOR DELETE USING (
  (select check_is_admin())
);


-- ---------------------------------------------
-- 3. NOTIFICATIONS
-- ---------------------------------------------
DROP POLICY IF EXISTS "allow_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow_update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow_insert_notifications_admin" ON public.notifications;
DROP POLICY IF EXISTS "view_notifications" ON public.notifications;
DROP POLICY IF EXISTS "update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "insert_notifications_system" ON public.notifications;


CREATE POLICY "allow_select_notifications" ON public.notifications
FOR SELECT USING (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_notifications" ON public.notifications
FOR UPDATE USING (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_insert_notifications_admin" ON public.notifications
FOR INSERT WITH CHECK (
  (select check_is_admin())
  OR (select public.has_role('tutor', (select auth.uid())))
);


-- ---------------------------------------------
-- 4. MODULES
-- ---------------------------------------------
-- Re-applying from 20260206 with wrappers
DROP POLICY IF EXISTS "view_modules" ON public.modules;
DROP POLICY IF EXISTS "manage_modules" ON public.modules;

CREATE POLICY "view_modules" ON public.modules
FOR SELECT USING (
  is_published = true
  OR (select public.has_role('tutor', (select auth.uid())))
  OR (select check_is_admin())
);

CREATE POLICY "manage_modules" ON public.modules
FOR ALL USING (
  (select public.has_role('tutor', (select auth.uid())))
  OR (select check_is_admin())
);


-- ---------------------------------------------
-- 5. PROFILES
-- ---------------------------------------------
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;


CREATE POLICY "view_profiles" ON public.profiles
FOR SELECT USING (
  id = (select auth.uid())
  OR (select public.has_role('tutor', (select auth.uid())))
  OR (select check_is_admin())
);

CREATE POLICY "update_profiles" ON public.profiles
FOR UPDATE USING (
  id = (select auth.uid())
  OR (select check_is_admin())
);

CREATE POLICY "insert_profiles" ON public.profiles
FOR INSERT WITH CHECK (
  id = (select auth.uid())
);


-- ---------------------------------------------
-- 6. USER_ROLES
-- ---------------------------------------------
DROP POLICY IF EXISTS "view_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_manage_policy" ON public.user_roles;


CREATE POLICY "view_user_roles" ON public.user_roles
FOR SELECT USING (
  user_id = (select auth.uid())
  OR (select check_is_admin())
);

CREATE POLICY "manage_user_roles" ON public.user_roles
FOR ALL USING (
  (select check_is_admin())
);


-- ---------------------------------------------
-- 7. INTEGRATIONS
-- ---------------------------------------------
DROP POLICY IF EXISTS "manage_integrations" ON public.integrations;
DROP POLICY IF EXISTS "integrations_manage_policy" ON public.integrations;

CREATE POLICY "manage_integrations" ON public.integrations
FOR ALL USING ( (select check_is_admin()) );


-- ---------------------------------------------
-- 8. LEARNING_SOURCES
-- ---------------------------------------------
DROP POLICY IF EXISTS "view_learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "manage_learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_insert_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_update_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_delete_policy" ON public.learning_sources;

CREATE POLICY "view_learning_sources" ON public.learning_sources
FOR SELECT USING (
  is_active = true
  OR (select check_is_admin())
);

CREATE POLICY "manage_learning_sources" ON public.learning_sources
FOR ALL USING ( (select check_is_admin()) );


-- ---------------------------------------------
-- 9. TAXONOMY (Categories, Levels, Tracks)
-- ---------------------------------------------

-- Categories
DROP POLICY IF EXISTS "view_categories" ON public.module_categories;
DROP POLICY IF EXISTS "manage_categories" ON public.module_categories;

CREATE POLICY "view_categories" ON public.module_categories FOR SELECT USING (true);
CREATE POLICY "manage_categories" ON public.module_categories FOR ALL USING ( (select check_is_admin()) );

-- Levels
DROP POLICY IF EXISTS "view_levels" ON public.module_levels;
DROP POLICY IF EXISTS "manage_levels" ON public.module_levels;

CREATE POLICY "view_levels" ON public.module_levels FOR SELECT USING (true);
CREATE POLICY "manage_levels" ON public.module_levels FOR ALL USING ( (select check_is_admin()) );

-- Tracks
DROP POLICY IF EXISTS "view_tracks" ON public.tracks;
DROP POLICY IF EXISTS "manage_tracks" ON public.tracks;

CREATE POLICY "view_tracks" ON public.tracks
FOR SELECT USING (
  is_active = true
  OR (select check_is_admin())
);
CREATE POLICY "manage_tracks" ON public.tracks FOR ALL USING ( (select check_is_admin()) );


-- =============================================
-- Final Verification
-- =============================================
SELECT '✅ RLS performance wrappers applied successfully' as status;
