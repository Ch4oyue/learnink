-- Migration: Upgrade Super Admin & APK features
-- Description: Adds labels, points, premium status, and system control tables.

-- 1. Update Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- 2. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings: Everyone can read, only Admin/Superadmin can update
CREATE POLICY "System settings are readable by everyone"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can update system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
);

-- 3. Create Label Configs Table
CREATE TABLE IF NOT EXISTS public.label_configs (
    id TEXT PRIMARY KEY, -- label name (e.g. 'sepuh-10')
    multiplier DECIMAL DEFAULT 1.0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for label_configs
ALTER TABLE public.label_configs ENABLE ROW LEVEL SECURITY;

-- Policies for label_configs: Everyone can read, only Admin/Superadmin can manage
CREATE POLICY "Label configs are readable by everyone"
ON public.label_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage label configs"
ON public.label_configs FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
);

-- 4. Seed Initial Data
INSERT INTO public.system_settings (key, value, description)
VALUES
('global_xp_multiplier', '1.0', 'Multiplier XP global untuk semua pengguna'),
('maintenance_mode', 'false', 'Kunci akses aplikasi untuk perbaikan'),
('broadcast_message', '{"title": "Selamat Datang!", "content": "Nikmati pengalaman belajar baru di LearnInk.", "active": false}', 'Pesan pengumuman global'),
('apk_base_bonus', '1.0', 'Bonus XP tambahan otomatis untuk pengguna APK (1.0 = +100% = Double XP)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.label_configs (id, multiplier, description)
VALUES
('sepuh-10', 3.0, 'Multiplier 3x untuk 10 orang pertama'),
('pioneer', 2.0, 'Multiplier 2x untuk 100 orang pertama'),
('loyal-mobile', 1.5, 'Multiplier 1.5x untuk pengguna aktif APK'),
('new-user-promo', 2.0, 'Multiplier 2x untuk pengguna baru (7 hari)')
ON CONFLICT (id) DO NOTHING;
