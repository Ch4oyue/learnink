-- Recreate get_popular_modules function if it's missing or broken
CREATE OR REPLACE FUNCTION public.get_popular_modules(limit_count int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  level text,
  category text,
  student_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    m.id,
    m.title,
    m.summary,
    m.level,
    m.category,
    count(distinct up.user_id) as student_count
  FROM modules m
  LEFT JOIN user_progress up ON m.id = up.module_id
  GROUP BY m.id
  ORDER BY student_count DESC
  LIMIT limit_count;
$$;
