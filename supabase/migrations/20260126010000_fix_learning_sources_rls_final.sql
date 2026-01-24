-- =============================================
-- FIX: Learning Sources RLS Policy (Definitive Fix)
-- Description: Splits the RLS policy into Public Read and Admin Write.
-- Prevents "FOR ALL" policies from blocking public SELECT access.
-- =============================================

-- 1. Drop ALL existing policies on learning_sources to ensure a clean slate
DROP POLICY IF EXISTS "Allow admin full access" ON public.learning_sources;
DROP POLICY IF EXISTS "Admin can manage learning_sources" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.learning_sources;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.learning_sources;
DROP POLICY IF EXISTS "Public can view active learning sources" ON public.learning_sources;

-- 2. Create Public Read Policy
-- Allow anyone (authenticated or anonymous) to view active learning sources
CREATE POLICY "Public can view active learning sources"
ON public.learning_sources
FOR SELECT
TO public
USING (is_active = true);

-- 3. Create Admin Write Policies
-- Only users with 'admin' role in user_roles can modify data

-- INSERT
CREATE POLICY "Admin can insert learning sources"
ON public.learning_sources
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- UPDATE
CREATE POLICY "Admin can update learning sources"
ON public.learning_sources
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- DELETE
CREATE POLICY "Admin can delete learning sources"
ON public.learning_sources
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);
