-- =============================================
-- Migration: Fix Performance RLS & Consolidate Policies
-- Date: 2026-01-29
-- Purpose: Resolve auth_rls_initplan (wrap auth.uid()) and multiple_permissive_policies (consolidate)
-- =============================================

-- =============================================
-- 1. Optimize Helper Functions
-- =============================================

-- Optimize has_role: Mark STABLE, use search_path=public, support hierarchy
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Superadmin has access to everything
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin') THEN
    RETURN true;
  END IF;

  -- Admin has access to moderator things (if desired, based on previous logic)
  IF _role = 'moderator' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
    RETURN true;
  END IF;

  -- Check for exact role match
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;

-- Optimize the older signature and forward to the new one
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_role, _user_id);
$$;


-- =============================================
-- 2. Refactor Policies by Table
-- =============================================

-- ---------------------------------------------
-- Table: public.profiles
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and tutors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

CREATE POLICY "allow_select_for_owner_admins_and_tutors" ON public.profiles
FOR SELECT USING (
  (select auth.uid()) = id
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_owner" ON public.profiles
FOR INSERT WITH CHECK (
  (select auth.uid()) = id
);

CREATE POLICY "allow_update_for_owner" ON public.profiles
FOR UPDATE USING (
  (select auth.uid()) = id
);


-- ---------------------------------------------
-- Table: public.user_roles
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;

CREATE POLICY "allow_select_for_owner_and_admins" ON public.user_roles
FOR SELECT USING (
  (select auth.uid()) = user_id
  OR public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.user_roles
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.user_roles
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.user_roles
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.modules
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;
DROP POLICY IF EXISTS "Tutors and admins can view all modules" ON public.modules;
DROP POLICY IF EXISTS "Tutors and admins can create modules" ON public.modules;
DROP POLICY IF EXISTS "Tutors can update own modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.modules;
DROP POLICY IF EXISTS "modules_select_policy" ON public.modules;
DROP POLICY IF EXISTS "modules_insert_policy" ON public.modules;
DROP POLICY IF EXISTS "modules_update_policy" ON public.modules;
DROP POLICY IF EXISTS "modules_delete_policy" ON public.modules;

CREATE POLICY "allow_select_for_public_published_or_privileged" ON public.modules
FOR SELECT USING (
  is_published = true
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins_and_tutors" ON public.modules
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins_or_tutor_owners" ON public.modules
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
  OR (public.has_role('tutor', (select auth.uid())) AND created_by = (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.modules
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.user_progress
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Tutors and admins can view all progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_select_policy" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_insert_policy" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_policy" ON public.user_progress;

CREATE POLICY "allow_select_for_owner_admins_and_tutors" ON public.user_progress
FOR SELECT USING (
  user_id = (select auth.uid())
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_owner" ON public.user_progress
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_for_owner" ON public.user_progress
FOR UPDATE USING (
  user_id = (select auth.uid())
);


-- ---------------------------------------------
-- Table: public.material_requests
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own requests" ON public.material_requests;
DROP POLICY IF EXISTS "Tutors and admins can view all requests" ON public.material_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.material_requests;
DROP POLICY IF EXISTS "Tutors and admins can update requests" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_select_policy" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_insert_policy" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_update_policy" ON public.material_requests;

CREATE POLICY "allow_select_for_owner_admins_and_tutors" ON public.material_requests
FOR SELECT USING (
  user_id = (select auth.uid())
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_owner" ON public.material_requests
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_for_admins_and_tutors" ON public.material_requests
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.notifications
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins and tutors can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;

CREATE POLICY "allow_select_for_owner" ON public.notifications
FOR SELECT USING (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_insert_for_admins_and_tutors" ON public.notifications
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_update_for_owner" ON public.notifications
FOR UPDATE USING (
  user_id = (select auth.uid())
);


-- ---------------------------------------------
-- Table: public.role_change_history
-- ---------------------------------------------
DROP POLICY IF EXISTS "Admins can view all role changes" ON public.role_change_history;
DROP POLICY IF EXISTS "Admins can create role change records" ON public.role_change_history;
DROP POLICY IF EXISTS "role_change_history_select_policy" ON public.role_change_history;
DROP POLICY IF EXISTS "role_change_history_insert_policy" ON public.role_change_history;

CREATE POLICY "allow_select_for_admins" ON public.role_change_history
FOR SELECT USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.role_change_history
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.quizzes
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view quizzes for published modules" ON public.quizzes;
DROP POLICY IF EXISTS "Tutors and admins can view all quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Tutors and admins can create quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Tutors can update own quizzes, admins can update all" ON public.quizzes;
DROP POLICY IF EXISTS "Admins can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_select_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_insert_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_update_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_delete_policy" ON public.quizzes;

CREATE POLICY "allow_select_for_published_module_or_privileged" ON public.quizzes
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM modules
    WHERE modules.id = quizzes.module_id
    AND modules.is_published = true
  ))
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins_and_tutors" ON public.quizzes
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins_or_tutor_owners" ON public.quizzes
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
  OR (public.has_role('tutor', (select auth.uid())) AND created_by = (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.quizzes
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.quiz_questions
-- ---------------------------------------------
DROP POLICY IF EXISTS "Only tutors and admins can query quiz_questions table" ON public.quiz_questions;
DROP POLICY IF EXISTS "Tutors and admins can create questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Tutors and admins can update questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select_policy" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_insert_policy" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_update_policy" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_delete_policy" ON public.quiz_questions;

CREATE POLICY "allow_select_for_admins_and_tutors" ON public.quiz_questions
FOR SELECT USING (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins_and_tutors" ON public.quiz_questions
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins_and_tutors" ON public.quiz_questions
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.quiz_questions
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.user_quiz_attempts
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Tutors and admins can view all attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "user_quiz_attempts_select_policy" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "user_quiz_attempts_insert_policy" ON public.user_quiz_attempts;
DROP POLICY IF EXISTS "user_quiz_attempts_update_policy" ON public.user_quiz_attempts;

CREATE POLICY "allow_select_for_owner_admins_and_tutors" ON public.user_quiz_attempts
FOR SELECT USING (
  user_id = (select auth.uid())
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_owner" ON public.user_quiz_attempts
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_for_owner" ON public.user_quiz_attempts
FOR UPDATE USING (
  user_id = (select auth.uid())
);


-- ---------------------------------------------
-- Table: public.learning_notes
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Tutors and admins can view all notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can create own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.learning_notes;
DROP POLICY IF EXISTS "learning_notes_select_policy" ON public.learning_notes;
DROP POLICY IF EXISTS "learning_notes_insert_policy" ON public.learning_notes;
DROP POLICY IF EXISTS "learning_notes_update_policy" ON public.learning_notes;
DROP POLICY IF EXISTS "learning_notes_delete_policy" ON public.learning_notes;

CREATE POLICY "allow_select_for_owner_admins_and_tutors" ON public.learning_notes
FOR SELECT USING (
  user_id = (select auth.uid())
  OR public.has_role('admin', (select auth.uid()))
  OR public.has_role('tutor', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_owner" ON public.learning_notes
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_for_owner" ON public.learning_notes
FOR UPDATE USING (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_delete_for_owner" ON public.learning_notes
FOR DELETE USING (
  user_id = (select auth.uid())
);


-- ---------------------------------------------
-- Table: public.module_categories
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view categories" ON public.module_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.module_categories;
DROP POLICY IF EXISTS "module_categories_select_policy" ON public.module_categories;
DROP POLICY IF EXISTS "module_categories_insert_policy" ON public.module_categories;
DROP POLICY IF EXISTS "module_categories_update_policy" ON public.module_categories;
DROP POLICY IF EXISTS "module_categories_delete_policy" ON public.module_categories;

CREATE POLICY "allow_select_for_all" ON public.module_categories
FOR SELECT USING (true);

CREATE POLICY "allow_insert_for_admins" ON public.module_categories
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.module_categories
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.module_categories
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.module_levels
-- ---------------------------------------------
DROP POLICY IF EXISTS "Anyone can view levels" ON public.module_levels;
DROP POLICY IF EXISTS "Admins can manage levels" ON public.module_levels;
DROP POLICY IF EXISTS "module_levels_select_policy" ON public.module_levels;
DROP POLICY IF EXISTS "module_levels_insert_policy" ON public.module_levels;
DROP POLICY IF EXISTS "module_levels_update_policy" ON public.module_levels;
DROP POLICY IF EXISTS "module_levels_delete_policy" ON public.module_levels;

CREATE POLICY "allow_select_for_all" ON public.module_levels
FOR SELECT USING (true);

CREATE POLICY "allow_insert_for_admins" ON public.module_levels
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.module_levels
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.module_levels
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.learning_sources
-- ---------------------------------------------
DROP POLICY IF EXISTS "Allow public read access for active sources" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_read_public" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_write_admin" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_select_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_insert_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_update_policy" ON public.learning_sources;
DROP POLICY IF EXISTS "learning_sources_delete_policy" ON public.learning_sources;

CREATE POLICY "allow_select_for_active_or_admins" ON public.learning_sources
FOR SELECT USING (
  is_active = true
  OR public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.learning_sources
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.learning_sources
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.learning_sources
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.user_notes
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can view own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Anyone can view public notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.user_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.user_notes;
DROP POLICY IF EXISTS "user_notes_select_policy" ON public.user_notes;
DROP POLICY IF EXISTS "user_notes_insert_policy" ON public.user_notes;
DROP POLICY IF EXISTS "user_notes_update_policy" ON public.user_notes;
DROP POLICY IF EXISTS "user_notes_delete_policy" ON public.user_notes;

CREATE POLICY "allow_select_for_owner_or_public" ON public.user_notes
FOR SELECT USING (
  user_id = (select auth.uid())
  OR is_public = true
);

CREATE POLICY "allow_insert_for_owner" ON public.user_notes
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_update_for_owner" ON public.user_notes
FOR UPDATE USING (
  user_id = (select auth.uid())
);

CREATE POLICY "allow_delete_for_owner" ON public.user_notes
FOR DELETE USING (
  user_id = (select auth.uid())
);


-- ---------------------------------------------
-- Table: public.integrations
-- ---------------------------------------------
DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;
DROP POLICY IF EXISTS "integrations_admin_all" ON public.integrations;
DROP POLICY IF EXISTS "integrations_select_policy" ON public.integrations;
DROP POLICY IF EXISTS "integrations_insert_policy" ON public.integrations;
DROP POLICY IF EXISTS "integrations_update_policy" ON public.integrations;
DROP POLICY IF EXISTS "integrations_delete_policy" ON public.integrations;

CREATE POLICY "allow_select_for_admins" ON public.integrations
FOR SELECT USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.integrations
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.integrations
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.integrations
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.incoming_contents
-- ---------------------------------------------
DROP POLICY IF EXISTS "Admin can manage incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_admin_all" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_select_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_insert_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_update_policy" ON public.incoming_contents;
DROP POLICY IF EXISTS "incoming_contents_delete_policy" ON public.incoming_contents;

CREATE POLICY "allow_select_for_admins" ON public.incoming_contents
FOR SELECT USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.incoming_contents
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.incoming_contents
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.incoming_contents
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- ---------------------------------------------
-- Table: public.tracks
-- ---------------------------------------------
DROP POLICY IF EXISTS "Admin can manage tracks" ON public.tracks;
DROP POLICY IF EXISTS "Anyone can view active tracks" ON public.tracks;
DROP POLICY IF EXISTS "tracks_select_policy" ON public.tracks;
DROP POLICY IF EXISTS "tracks_insert_policy" ON public.tracks;
DROP POLICY IF EXISTS "tracks_update_policy" ON public.tracks;
DROP POLICY IF EXISTS "tracks_delete_policy" ON public.tracks;

CREATE POLICY "allow_select_for_active_or_admins" ON public.tracks
FOR SELECT USING (
  is_active = true
  OR public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_insert_for_admins" ON public.tracks
FOR INSERT WITH CHECK (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_update_for_admins" ON public.tracks
FOR UPDATE USING (
  public.has_role('admin', (select auth.uid()))
);

CREATE POLICY "allow_delete_for_admins" ON public.tracks
FOR DELETE USING (
  public.has_role('admin', (select auth.uid()))
);


-- =============================================
-- Completion
-- =============================================
SELECT '✅ Performance RLS fixes applied successfully' as status;
