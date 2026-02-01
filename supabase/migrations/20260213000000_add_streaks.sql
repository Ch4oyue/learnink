-- Add streak columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Create function to update streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- If last_activity_date is null or more than 48 hours ago, reset current streak
    IF (OLD.last_activity_date IS NULL OR OLD.last_activity_date < NOW() - INTERVAL '48 hours') THEN
        NEW.current_streak := 1;
    -- If last activity was between 24 and 48 hours ago, increment streak
    ELSIF (OLD.last_activity_date < NOW() - INTERVAL '24 hours') THEN
        NEW.current_streak := OLD.current_streak + 1;
    -- Otherwise keep current streak
    ELSE
        NEW.current_streak := OLD.current_streak;
    END IF;

    -- Update longest streak if current is higher
    IF (NEW.current_streak > OLD.longest_streak) THEN
        NEW.longest_streak := NEW.current_streak;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak update
DROP TRIGGER IF EXISTS on_profile_activity_update ON public.profiles;
CREATE TRIGGER on_profile_activity_update
BEFORE UPDATE OF last_activity_date ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();
