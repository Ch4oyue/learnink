-- Create learning_notes table for user notes feature
CREATE TABLE public.learning_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  highlighted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notes
CREATE POLICY "Users can view own notes" 
ON public.learning_notes 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can create their own notes
CREATE POLICY "Users can create own notes" 
ON public.learning_notes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update own notes" 
ON public.learning_notes 
FOR UPDATE 
USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" 
ON public.learning_notes 
FOR DELETE 
USING (user_id = auth.uid());

-- Tutors and admins can view all notes (for analytics)
CREATE POLICY "Tutors and admins can view all notes"
ON public.learning_notes 
FOR SELECT 
USING (has_role(auth.uid(), 'tutor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_learning_notes_updated_at
BEFORE UPDATE ON public.learning_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create module_categories table for admin management
CREATE TABLE public.module_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon_name TEXT DEFAULT 'Folder',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.module_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.module_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create module_levels table for admin management
CREATE TABLE public.module_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#10B981',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view levels
CREATE POLICY "Anyone can view levels"
ON public.module_levels
FOR SELECT
USING (true);

-- Only admins can manage levels
CREATE POLICY "Admins can manage levels"
ON public.module_levels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.module_categories (name, description, color, icon_name, order_index) VALUES
('AI & Machine Learning', 'Materi tentang Artificial Intelligence dan Machine Learning', '#8B5CF6', 'Brain', 1),
('Automation', 'Materi tentang otomatisasi proses kerja', '#F59E0B', 'Zap', 2),
('Productivity', 'Materi tentang produktivitas dan efisiensi', '#10B981', 'Target', 3),
('Data Analysis', 'Materi tentang analisis data', '#3B82F6', 'BarChart', 4),
('Umum', 'Kategori umum', '#6B7280', 'Folder', 5);

-- Insert default levels
INSERT INTO public.module_levels (name, description, color, order_index) VALUES
('Pemula', 'Untuk yang baru memulai', '#10B981', 1),
('Menengah', 'Untuk yang sudah memiliki dasar', '#F59E0B', 2),
('Lanjutan', 'Untuk yang sudah mahir', '#EF4444', 3);