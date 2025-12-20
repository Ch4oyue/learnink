-- ================================================================
-- FIX: Quiz answers RLS exposure - Prevent direct table access
-- Regular users can ONLY access questions via secure RPC function
-- ================================================================

-- Drop existing SELECT policies that could expose answers
DROP POLICY IF EXISTS "Tutors and admins can view all questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Anyone can view questions for accessible quizzes" ON public.quiz_questions;

-- Create restrictive policy: ONLY tutors/admins can query the table directly
-- This means regular users CANNOT use supabase.from('quiz_questions').select('*')
CREATE POLICY "Only tutors and admins can query quiz_questions table"
ON public.quiz_questions
FOR SELECT
USING (
  has_role(auth.uid(), 'tutor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- ================================================================
-- The get_quiz_questions_safe() function already exists and returns
-- questions WITHOUT correct_answer for regular users.
-- Students must use: supabase.rpc('get_quiz_questions_safe', { p_quiz_id: id })
-- ================================================================