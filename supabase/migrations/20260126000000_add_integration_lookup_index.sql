-- =============================================
-- Migration: Add index to api_key_preview
-- Purpose: Enable O(1) lookup of integrations by API key preview to avoid linear scan
-- =============================================

CREATE INDEX IF NOT EXISTS idx_integrations_api_key_preview
ON public.integrations(api_key_preview);

COMMENT ON INDEX public.idx_integrations_api_key_preview IS 'Index to optimize API key lookup during content ingestion';
