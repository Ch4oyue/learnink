-- Add streak tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Create function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_act TIMESTAMP WITH TIME ZONE;
    curr_streak INTEGER;
    days_diff INTEGER;
BEGIN
    last_act := OLD.last_activity_date;
    curr_streak := OLD.current_streak;

    -- If there's no previous activity, start with 1
    IF last_act IS NULL THEN
        NEW.current_streak := 1;
        NEW.longest_streak := GREATEST(OLD.longest_streak, 1);
        RETURN NEW;
    END IF;

    -- Calculate difference in days (UTC)
    days_diff := DATE_PART('day', NEW.last_activity_date::timestamp - last_act::timestamp);

    -- If active on the same calendar day, do nothing (keep current streak)
    IF days_diff = 0 THEN
        NEW.current_streak := curr_streak;
    -- If active on the next day, increment streak
    ELSIF days_diff = 1 THEN
        NEW.current_streak := curr_streak + 1;
        NEW.longest_streak := GREATEST(OLD.longest_streak, curr_streak + 1);
    -- If missed a day, reset streak to 1
    ELSE
        NEW.current_streak := 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for streak update
DROP TRIGGER IF EXISTS on_profile_activity_update ON public.profiles;
CREATE TRIGGER on_profile_activity_update
    BEFORE UPDATE OF last_activity_date ON public.profiles
    FOR EACH ROW
    WHEN (NEW.last_activity_date IS DISTINCT FROM OLD.last_activity_date)
    EXECUTE FUNCTION public.update_user_streak();
