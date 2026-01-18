-- Create a function to get the count of unique students
-- This replaces the inefficient client-side counting of all user_progress records
CREATE OR REPLACE FUNCTION get_unique_student_count()
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT COUNT(DISTINCT user_id)::integer FROM user_progress;
$$;
