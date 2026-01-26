-- =============================================
-- MIGRATION: Fix Superadmin Permissions
-- Ensures Superadmin has the same (or better) access as Admin
-- =============================================

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Allow Admin AND Superadmin (and Tutor) to view all profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin', 'tutor')
    )
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- =============================================
-- 2. USER_ROLES TABLE
-- =============================================

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;

-- Allow Admin AND Superadmin to view all roles
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role IN ('admin', 'superadmin')
    )
);

-- Allow Admin AND Superadmin to manage roles
CREATE POLICY "user_roles_manage_policy" ON public.user_roles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role IN ('admin', 'superadmin')
    )
);

-- =============================================
-- 3. INCOMING_CONTENTS TABLE (Content Approval)
-- =============================================

DROP POLICY IF EXISTS "incoming_contents_admin_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admin can manage incoming_contents" ON public.incoming_contents;

CREATE POLICY "incoming_contents_manage_policy" ON public.incoming_contents
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
);

-- =============================================
-- 4. INTEGRATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "integrations_admin_policy" ON public.integrations;
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;

CREATE POLICY "integrations_manage_policy" ON public.integrations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
);

-- =============================================
-- 5. LEARNING_SOURCES TABLE
-- =============================================

-- Note: SELECT is usually public for active sources, but management needs update

DROP POLICY IF EXISTS "learning_sources_insert_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_update_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_delete_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;

-- Insert
CREATE POLICY "learning_sources_insert_policy" ON public.learning_sources
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
);

-- Update
CREATE POLICY "learning_sources_update_policy" ON public.learning_sources
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
);

-- Delete
CREATE POLICY "learning_sources_delete_policy" ON public.learning_sources
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'superadmin')
    )
);

-- =============================================
-- DONE
-- =============================================
SELECT 'Superadmin permissions fixed successfully' as status;
