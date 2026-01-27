-- =============================================
-- MIGRATION: Fix Superadmin Permissions
-- Ensures Superadmin has the same (or better) access as Admin
-- Uses SECURITY DEFINER function to avoid RLS recursion on user_roles
-- =============================================

-- Create a secure function to check admin status (bypassing RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Allow Admin AND Superadmin (and Tutor) to view all profiles
-- Tutors also need to see profiles sometimes, so we keep the role check flexible for them,
-- but check_is_admin handles admin/superadmin efficiently.
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = auth.uid()
    OR check_is_admin()
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'tutor'
    )
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR check_is_admin())
WITH CHECK (id = auth.uid() OR check_is_admin());

-- =============================================
-- 2. USER_ROLES TABLE
-- =============================================

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_manage_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;


-- Allow Admin AND Superadmin to view all roles
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR check_is_admin()
);

-- Allow Admin AND Superadmin to manage roles
CREATE POLICY "user_roles_manage_policy" ON public.user_roles
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

-- =============================================
-- 3. INCOMING_CONTENTS TABLE (Content Approval)
-- =============================================

DROP POLICY IF EXISTS "incoming_contents_admin_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_manage_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admin can manage incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admins can view incoming contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admins can update incoming contents" ON public.incoming_contents;

CREATE POLICY "incoming_contents_manage_policy" ON public.incoming_contents
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

-- =============================================
-- 4. INTEGRATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "integrations_admin_policy" ON public.integrations;
DROP POLICY IF EXISTS "integrations_manage_policy" ON public.integrations;
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integrations;

CREATE POLICY "integrations_manage_policy" ON public.integrations
FOR ALL TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

-- =============================================
-- 5. LEARNING_SOURCES TABLE
-- =============================================

DROP POLICY IF EXISTS "learning_sources_insert_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_update_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_delete_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "Admins can manage learning_sources" ON public.learning_sources;


-- Insert
CREATE POLICY "learning_sources_insert_policy" ON public.learning_sources
FOR INSERT TO authenticated
WITH CHECK ( check_is_admin() );

-- Update
CREATE POLICY "learning_sources_update_policy" ON public.learning_sources
FOR UPDATE TO authenticated
USING ( check_is_admin() )
WITH CHECK ( check_is_admin() );

-- Delete
CREATE POLICY "learning_sources_delete_policy" ON public.learning_sources
FOR DELETE TO authenticated
USING ( check_is_admin() );

-- =============================================
-- DONE
-- =============================================
SELECT 'Superadmin permissions fixed successfully' as status;
