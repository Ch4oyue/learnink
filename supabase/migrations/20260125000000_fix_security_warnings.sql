-- =============================================
-- Fix Security Warnings: Function Search Path Mutable
-- Purpose: Explicitly set search_path to 'public' for security definer/invoker functions
-- Date: 2026-01-25
-- =============================================

-- 1. Fix log_security_event
ALTER FUNCTION public.log_security_event(
    security_event_type, INET, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB
) SET search_path = public;

-- 2. Fix check_rate_limit
ALTER FUNCTION public.check_rate_limit(
    TEXT, TEXT, INTEGER, INTEGER
) SET search_path = public;

-- 3. Fix cleanup_rate_limits
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = public;

-- 4. Fix protect_super_admin
ALTER FUNCTION public.protect_super_admin() SET search_path = public;

-- 5. Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- =============================================
-- DONE
-- =============================================
SELECT '✅ Security search_paths fixed successfully!' as status;
