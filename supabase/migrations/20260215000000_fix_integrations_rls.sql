-- Migration: Fix integrations RLS
-- Description: Allow superadmin to manage integrations, alongside admin.

DROP POLICY IF EXISTS "Admin can manage integrations" ON public.integrations;

CREATE POLICY "Admins and Superadmins can manage integrations"
ON public.integrations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
);
