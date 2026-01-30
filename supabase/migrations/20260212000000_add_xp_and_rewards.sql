-- Add XP to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Add reward_claimed to user_progress
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS reward_claimed BOOLEAN DEFAULT FALSE;

-- Add index for performance on reward lookup
CREATE INDEX IF NOT EXISTS idx_user_progress_reward_claimed
ON public.user_progress(reward_claimed);

-- Security: No RLS needed for column-level, but ensure standard policies allow reading these (covered by existing SELECT policies)
