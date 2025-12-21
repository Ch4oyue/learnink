-- Add RLS policy for admin/tutor to view all profiles
CREATE POLICY "Admins and tutors can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tutor'::app_role));

-- Enable realtime for profiles and user_roles tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;