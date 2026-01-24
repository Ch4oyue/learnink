-- =============================================
-- SECURITY FIX: Remove PII (email) from public profiles
-- The email column in profiles was accessible to all authenticated users via RLS.
-- This migration removes the column and associated sync logic to prevent PII leakage.
-- Users identifying logic should rely on auth.users (server-side) or ID checks.
-- =============================================

-- 1. Drop the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

-- 2. Drop the sync function
DROP FUNCTION IF EXISTS public.sync_profile_email();

-- 3. Drop the index (will be dropped with column, but good to be explicit or if we kept column)
DROP INDEX IF EXISTS public.idx_profiles_email;

-- 4. Drop the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

SELECT '✅ PII (email) removed from public profiles table.' as status;
