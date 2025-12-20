-- Add INSERT policy to restrict notification creation to admins and tutors only
CREATE POLICY "Admins and tutors can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tutor'::app_role)
);