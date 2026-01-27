-- =============================================
-- MIGRATION: Add Request Types and Image Support
-- Enhance material_requests table to support different types (Module, Feature, Bug)
-- =============================================

-- 1. Create request_type ENUM
DO $$ BEGIN
    CREATE TYPE public.request_type AS ENUM ('module', 'feature', 'bug');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to material_requests
ALTER TABLE public.material_requests
ADD COLUMN IF NOT EXISTS type public.request_type DEFAULT 'module',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_requests_type ON public.material_requests(type);

-- 4. Update RLS Policies
-- Users can create requests of any type
DROP POLICY IF EXISTS "Users can create requests" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_insert_policy" ON public.material_requests;

CREATE POLICY "material_requests_insert_policy" ON public.material_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- Users can view ONLY their own requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_select_policy" ON public.material_requests;

CREATE POLICY "material_requests_select_policy" ON public.material_requests
FOR SELECT TO authenticated
USING (
    user_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor', 'superadmin')
    )
);

-- Tutors/Admins can update requests (e.g. status)
DROP POLICY IF EXISTS "Tutors and admins can update requests" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_update_policy" ON public.material_requests;

CREATE POLICY "material_requests_update_policy" ON public.material_requests
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = (select auth.uid())
        AND user_roles.role IN ('admin', 'tutor', 'superadmin')
    )
);

-- =============================================
-- DONE
-- =============================================
SELECT 'Request types and image support added successfully' as status;
