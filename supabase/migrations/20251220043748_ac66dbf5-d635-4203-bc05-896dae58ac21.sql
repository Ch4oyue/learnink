-- Remove the overly permissive policy that exposes all profiles to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;