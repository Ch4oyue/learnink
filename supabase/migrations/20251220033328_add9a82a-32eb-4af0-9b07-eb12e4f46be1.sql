-- =============================================
-- Phase 1: Create notifications table
-- =============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info', -- info, success, warning, request, module
  is_read boolean DEFAULT false,
  related_request_id uuid REFERENCES public.material_requests(id) ON DELETE SET NULL,
  related_module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Phase 2: Enhance modules table
-- =============================================
ALTER TABLE public.modules 
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_request_id uuid REFERENCES public.material_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Umum';

-- =============================================
-- Phase 3: Enhance material_requests table
-- =============================================
ALTER TABLE public.material_requests 
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS category text;

-- =============================================
-- Phase 4: Create role_change_history table (Audit Trail)
-- =============================================
CREATE TABLE public.role_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role app_role NOT NULL,
  new_role app_role NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_change_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_change_history
CREATE POLICY "Admins can view all role changes"
  ON public.role_change_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create role change records"
  ON public.role_change_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));