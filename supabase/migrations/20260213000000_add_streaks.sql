-- Add streak tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ DEFAULT NOW();

-- Create function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_activity DATE;
    current_date_user DATE;
BEGIN
    -- Get the date of the last activity (handling timezone if needed, defaulting to UTC for now)
    last_activity := DATE(OLD.last_activity_date);
    current_date_user := DATE(NEW.last_activity_date);

    -- If activity is on the same day, do nothing (keep streak)
    IF last_activity = current_date_user THEN
        RETURN NEW;
    END IF;

    -- If activity is exactly 1 day after last activity, increment streak
    IF current_date_user = last_activity + INTERVAL '1 day' THEN
        NEW.current_streak := OLD.current_streak + 1;
    ELSE
        -- If missed a day (or more), reset streak to 1 (since they are active now)
        NEW.current_streak := 1;
    END IF;

    -- Update longest streak if current exceeds it
    IF NEW.current_streak > OLD.longest_streak THEN
        NEW.longest_streak := NEW.current_streak;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update streak when last_activity_date changes
DROP TRIGGER IF EXISTS on_profile_activity_update ON public.profiles;
CREATE TRIGGER on_profile_activity_update
    BEFORE UPDATE OF last_activity_date ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_streak();
