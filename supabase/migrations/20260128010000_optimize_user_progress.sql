-- Optimize user_progress table for module-based lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON public.user_progress(module_id);

-- Add comment explaining the index
COMMENT ON INDEX public.idx_user_progress_module_id IS 'Index to speed up queries filtering user_progress by module_id (e.g. popular modules, student counts)';
