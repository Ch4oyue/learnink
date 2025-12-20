-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 15,
  passing_score INTEGER DEFAULT 70,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_quiz_attempts table
CREATE TABLE public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Anyone can view quizzes for published modules"
ON public.quizzes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.modules 
    WHERE modules.id = quizzes.module_id 
    AND modules.is_published = true
  )
);

CREATE POLICY "Tutors and admins can view all quizzes"
ON public.quizzes FOR SELECT
USING (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tutors and admins can create quizzes"
ON public.quizzes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tutors can update own quizzes, admins can update all"
ON public.quizzes FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quizzes"
ON public.quizzes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quiz_questions
CREATE POLICY "Anyone can view questions for accessible quizzes"
ON public.quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
    WHERE q.id = quiz_questions.quiz_id
    AND (m.is_published = true OR has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Tutors and admins can create questions"
ON public.quiz_questions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tutors and admins can update questions"
ON public.quiz_questions FOR UPDATE
USING (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
ON public.quiz_questions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_quiz_attempts
CREATE POLICY "Users can view own attempts"
ON public.user_quiz_attempts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Tutors and admins can view all attempts"
ON public.user_quiz_attempts FOR SELECT
USING (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own attempts"
ON public.user_quiz_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts"
ON public.user_quiz_attempts FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at on quizzes
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;