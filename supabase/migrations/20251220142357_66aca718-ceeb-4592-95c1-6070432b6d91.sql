-- ================================================================
-- FIX: Prevent moderator role from being assigned
-- Alternative approach: Add constraint instead of removing from enum
-- ================================================================

-- Drop the temporary app_role_new type if it exists from failed migrations
DROP TYPE IF EXISTS public.app_role_new CASCADE;

-- Restore default on user_roles if it was dropped
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Add constraint to prevent moderator role from being assigned
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS prevent_moderator_role;
  
ALTER TABLE public.user_roles
  ADD CONSTRAINT prevent_moderator_role 
  CHECK (role IN ('user', 'tutor', 'admin'));