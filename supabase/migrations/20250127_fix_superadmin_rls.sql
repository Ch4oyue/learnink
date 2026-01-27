-- =============================================
-- FIX: Super Admin RLS Access
-- Updates RLS policies to explicitly include 'superadmin' role
-- Fixes issue where Super Admin cannot view other users/profiles
-- =============================================

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor', 'superadmin')
    )
);

-- =============================================
-- 2. USER_ROLES TABLE
-- =============================================

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;

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

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
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
-- 3. MODULES TABLE (Also ensuring superadmin access)
-- =============================================

DROP POLICY IF EXISTS "modules_select_policy" ON public.modules;

CREATE POLICY "modules_select_policy" ON public.modules
FOR SELECT
USING (
    is_published = true
    OR created_by = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor', 'superadmin')
    )
);

-- =============================================
-- 4. ROLE_CHANGE_HISTORY (Admin/Superadmin only)
-- =============================================

DROP POLICY IF EXISTS "role_change_history_policy" ON public.role_change_history;

CREATE POLICY "role_change_history_policy" ON public.role_change_history
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

SELECT 'Super Admin RLS policies updated successfully!' as status;
