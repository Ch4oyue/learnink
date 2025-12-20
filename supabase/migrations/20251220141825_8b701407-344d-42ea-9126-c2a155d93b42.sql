-- Drop the SECURITY DEFINER view (it's a security risk)
DROP VIEW IF EXISTS public.quiz_questions_safe;

-- The secure function get_quiz_questions_safe is fine, we keep it.
-- Students will use this RPC function to get questions without answers.