-- Drop existing permissive SELECT policy that exposes answers
DROP POLICY IF EXISTS "Anyone can view questions for accessible quizzes" ON public.quiz_questions;

-- Create a more restrictive policy: regular users can only see questions (not answers) via a secure view
-- Tutors and admins can see everything
CREATE POLICY "Tutors and admins can view all questions" 
ON public.quiz_questions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'tutor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create a secure view that excludes correct_answer for students
CREATE OR REPLACE VIEW public.quiz_questions_safe AS
SELECT 
  id,
  quiz_id,
  question_text,
  question_type,
  options,
  points,
  order_index,
  created_at
FROM public.quiz_questions;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.quiz_questions_safe TO authenticated;

-- Create a security definer function to check if user can access quiz questions
-- This ensures students can only access questions for published modules
CREATE OR REPLACE FUNCTION public.get_quiz_questions_safe(p_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question_text text,
  question_type text,
  options jsonb,
  points integer,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if quiz exists and belongs to a published module
  IF NOT EXISTS (
    SELECT 1 FROM quizzes q
    JOIN modules m ON m.id = q.module_id
    WHERE q.id = p_quiz_id AND m.is_published = true
  ) THEN
    -- Check if user is tutor/admin (can see unpublished)
    IF NOT (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    qq.id,
    qq.quiz_id,
    qq.question_text,
    qq.question_type,
    qq.options,
    qq.points,
    qq.order_index
  FROM quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id
  ORDER BY qq.order_index ASC;
END;
$$;