-- =============================================
-- FIX: RLS Performance Optimization
-- Fixes auth_rls_initplan warnings by wrapping auth.uid() in (select ...)
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and tutors can view all profiles" ON public.profiles;

-- Optimized: Combined SELECT policy
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
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

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Optimized: Combined SELECT policy
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role = 'admin'
    )
);

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (select auth.uid())
        AND ur.role = 'admin'
    )
);

-- =============================================
-- 3. MODULES TABLE
-- =============================================

DROP POLICY IF EXISTS "Tutors and admins can view all modules" ON public.modules;
DROP POLICY IF EXISTS "Tutors and admins can create modules" ON public.modules;
DROP POLICY IF EXISTS "Tutors can update own modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.modules;
DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;

-- Optimized: Combined SELECT policy
CREATE POLICY "modules_select_policy" ON public.modules
FOR SELECT
USING (
    is_published = true
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "modules_insert_policy" ON public.modules
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "modules_update_policy" ON public.modules
FOR UPDATE TO authenticated
USING (
    created_by = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

CREATE POLICY "modules_delete_policy" ON public.modules
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 4. USER_PROGRESS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Tutors and admins can view all progress" ON public.user_progress;

-- Optimized: Combined SELECT policy
CREATE POLICY "user_progress_select_policy" ON public.user_progress
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "user_progress_insert_policy" ON public.user_progress
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "user_progress_update_policy" ON public.user_progress
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- =============================================
-- 5. MATERIAL_REQUESTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can create requests" ON public.material_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.material_requests;
DROP POLICY IF EXISTS "Tutors and admins can view all requests" ON public.material_requests;
DROP POLICY IF EXISTS "Tutors and admins can update requests" ON public.material_requests;

-- Optimized: Combined SELECT policy
CREATE POLICY "material_requests_select_policy" ON public.material_requests
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "material_requests_insert_policy" ON public.material_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "material_requests_update_policy" ON public.material_requests
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

-- =============================================
-- 6. NOTIFICATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins and tutors can create notifications" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "notifications_insert_policy" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

-- =============================================
-- 7. ROLE_CHANGE_HISTORY TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can view all role changes" ON public.role_change_history;
DROP POLICY IF EXISTS "Admins can create role change records" ON public.role_change_history;

CREATE POLICY "role_change_history_policy" ON public.role_change_history
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 8. QUIZZES TABLE
-- =============================================

DROP POLICY IF EXISTS "Tutors and admins can view all quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Tutors and admins can create quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Tutors can update own quizzes, admins can update all" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Anyone can view quizzes for published modules" ON public.quizzes;

-- Optimized: Combined SELECT policy
CREATE POLICY "quizzes_select_policy" ON public.quizzes
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.modules WHERE modules.id = quizzes.module_id AND modules.is_published = true)
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "quizzes_insert_policy" ON public.quizzes
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "quizzes_update_policy" ON public.quizzes
FOR UPDATE TO authenticated
USING (
    created_by = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

CREATE POLICY "quizzes_delete_policy" ON public.quizzes
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 9. QUIZ_QUESTIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Only tutors and admins can query quiz_questions table" ON public.quiz_questions;
DROP POLICY IF EXISTS "Tutors and admins can create questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Tutors and admins can update questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.quiz_questions;

CREATE POLICY "quiz_questions_select_policy" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "quiz_questions_insert_policy" ON public.quiz_questions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "quiz_questions_update_policy" ON public.quiz_questions
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "quiz_questions_delete_policy" ON public.quiz_questions
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 10. USER_QUIZ_ATTEMPTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Tutors and admins can view all attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON public.user_quiz_attempts;

-- Optimized: Combined SELECT policy
CREATE POLICY "user_quiz_attempts_select_policy" ON public.user_quiz_attempts
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "user_quiz_attempts_insert_policy" ON public.user_quiz_attempts
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "user_quiz_attempts_update_policy" ON public.user_quiz_attempts
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- =============================================
-- 11. LEARNING_NOTES TABLE
-- =============================================

DROP POLICY IF EXISTS "Users can view own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can create own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Tutors and admins can view all notes" ON public.learning_notes;

-- Optimized: Combined SELECT policy
CREATE POLICY "learning_notes_select_policy" ON public.learning_notes
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor')
    )
);

CREATE POLICY "learning_notes_insert_policy" ON public.learning_notes
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "learning_notes_update_policy" ON public.learning_notes
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "learning_notes_delete_policy" ON public.learning_notes
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

-- =============================================
-- 12. MODULE_CATEGORIES TABLE
-- =============================================

DROP POLICY IF EXISTS "Anyone can view categories" ON public.module_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.module_categories;

CREATE POLICY "module_categories_select_policy" ON public.module_categories
FOR SELECT USING (true);

CREATE POLICY "module_categories_admin_policy" ON public.module_categories
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 13. MODULE_LEVELS TABLE
-- =============================================

DROP POLICY IF EXISTS "Anyone can view levels" ON public.module_levels;
DROP POLICY IF EXISTS "Admins can manage levels" ON public.module_levels;

CREATE POLICY "module_levels_select_policy" ON public.module_levels
FOR SELECT USING (true);

CREATE POLICY "module_levels_admin_policy" ON public.module_levels
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 14. LEARNING_SOURCES TABLE
-- =============================================

DROP POLICY IF EXISTS "Allow public read access for active sources" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;

CREATE POLICY "learning_sources_select_policy" ON public.learning_sources
FOR SELECT USING (is_active = true);

CREATE POLICY "learning_sources_admin_policy" ON public.learning_sources
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 15. INTEGRATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;

CREATE POLICY "integrations_admin_policy" ON public.integrations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- 16. INCOMING_CONTENTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admin can manage incoming_contents" ON public.incoming_contents;

CREATE POLICY "incoming_contents_admin_policy" ON public.incoming_contents
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role = 'admin'
    )
);

-- =============================================
-- DONE! All RLS policies optimized
-- =============================================
SELECT 'RLS policies optimized successfully!' as status;
