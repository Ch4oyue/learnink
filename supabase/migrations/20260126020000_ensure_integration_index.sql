-- =============================================
-- OPTIMIZATION: Index for API Key Lookup
-- Description: Ensures the api_key_preview column is indexed for O(1) lookups
-- during the content ingestion authentication process.
-- =============================================

CREATE INDEX IF NOT EXISTS idx_integrations_api_key_preview
ON public.integrations(api_key_preview);

COMMENT ON INDEX public.idx_integrations_api_key_preview IS 'Optimizes lookup of integrations by their API key preview (prefix+suffix) during authentication.';
