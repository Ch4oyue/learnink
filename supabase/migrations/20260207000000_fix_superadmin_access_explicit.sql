-- =============================================
-- Migration: Fix Super Admin Access (Explicit Policies)
-- Date: 2026-02-07
-- Purpose: Explicitly grant 'superadmin' access to Inbox tables (incoming_contents, material_requests)
--          by bypassing generic helper functions and checking roles directly.
-- =============================================

-- ---------------------------------------------
-- 1. INCOMING_CONTENTS (Admin Inbox)
-- ---------------------------------------------

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can select incoming contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admin can update incoming contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "Admin can delete incoming contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_select_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_insert_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_update_incoming_contents" ON public.incoming_contents;
DROP POLICY IF EXISTS "admin_delete_incoming_contents" ON public.incoming_contents;

-- Create EXPLICIT policies for Admin + Superadmin
CREATE POLICY "allow_select_incoming_contents" ON public.incoming_contents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "allow_insert_incoming_contents" ON public.incoming_contents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "allow_update_incoming_contents" ON public.incoming_contents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "allow_delete_incoming_contents" ON public.incoming_contents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);


-- ---------------------------------------------
-- 2. MATERIAL_REQUESTS (User Requests)
-- ---------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "view_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "insert_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "update_material_requests" ON public.material_requests;
DROP POLICY IF EXISTS "delete_material_requests" ON public.material_requests;

-- SELECT: Users see their own. Admin/Superadmin/Tutor see ALL.
CREATE POLICY "allow_select_material_requests" ON public.material_requests
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tutor', 'admin', 'superadmin')
  )
);

-- INSERT: Authenticated users can create requests (for themselves)
CREATE POLICY "allow_insert_material_requests" ON public.material_requests
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: Admin/Superadmin/Tutor can update (status, notes). Users CANNOT update (usually).
CREATE POLICY "allow_update_material_requests" ON public.material_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tutor', 'admin', 'superadmin')
  )
);

-- DELETE: Only Admin/Superadmin can delete requests
CREATE POLICY "allow_delete_material_requests" ON public.material_requests
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'superadmin')
  )
);

-- ---------------------------------------------
-- 3. NOTIFICATIONS (Just in case)
-- ---------------------------------------------
-- Drop restrictive policies if they exist (standard policy is usually user_id = auth.uid())
-- We ensure Super Admin can also VIEW notifications if needed (e.g. system alerts)
-- But typically notifications are personal. We'll leave the personal policy alone
-- but ensure Admin/Superadmin can DELETE/MANAGE system-wide if that was the intent.
-- For now, we will just ensure the basic personal access is safe and correct.

DROP POLICY IF EXISTS "view_notifications" ON public.notifications;
DROP POLICY IF EXISTS "update_notifications" ON public.notifications;

-- View own notifications
CREATE POLICY "allow_select_notifications" ON public.notifications
FOR SELECT USING (
  user_id = auth.uid()
);

-- Update (mark as read) own notifications
CREATE POLICY "allow_update_notifications" ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid()
);

-- Insert: Usually done by system (service_role).
-- If Admins need to create notifications manually for others:
CREATE POLICY "allow_insert_notifications_admin" ON public.notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tutor', 'admin', 'superadmin')
  )
);
