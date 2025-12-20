-- Create request_status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'reviewing', 'completed', 'rejected');

-- Create modules table
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  level text DEFAULT 'Pemula',
  icon_name text DEFAULT 'BookOpen',
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  progress_percent int DEFAULT 0,
  is_completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT progress_range CHECK (progress_percent >= 0 AND progress_percent <= 100),
  UNIQUE(user_id, module_id)
);

-- Create material_requests table
CREATE TABLE public.material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  description text,
  status public.request_status DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-assigning default role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Triggers for updated_at
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_requests_updated_at
  BEFORE UPDATE ON public.material_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for modules
CREATE POLICY "Anyone can view published modules"
  ON public.modules FOR SELECT
  USING (is_published = true);

CREATE POLICY "Tutors and admins can view all modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors and admins can create modules"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors can update own modules"
  ON public.modules FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete modules"
  ON public.modules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tutors and admins can view all progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for material_requests
CREATE POLICY "Users can create requests"
  ON public.material_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own requests"
  ON public.material_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tutors and admins can view all requests"
  ON public.material_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutors and admins can update requests"
  ON public.material_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin'));

-- Policy for admins to manage user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));