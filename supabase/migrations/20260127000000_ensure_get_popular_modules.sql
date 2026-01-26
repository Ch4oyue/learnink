-- Ensure get_popular_modules exists and is accessible
CREATE OR REPLACE FUNCTION public.get_popular_modules(limit_count int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  student_count bigint,
  is_published boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.summary,
    (SELECT COUNT(*) FROM user_progress up WHERE up.module_id = m.id)::bigint as student_count,
    m.is_published
  FROM modules m
  WHERE m.is_published = true
  ORDER BY student_count DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_popular_modules(int) TO postgres;
GRANT EXECUTE ON FUNCTION public.get_popular_modules(int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_popular_modules(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_modules(int) TO service_role;
