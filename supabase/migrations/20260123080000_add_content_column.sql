-- Add content column to incoming_contents for storing markdown body
-- This allows direct storage of Notion page body content as markdown

ALTER TABLE public.incoming_contents 
ADD COLUMN IF NOT EXISTS content TEXT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.incoming_contents.content IS 'Main markdown content from Notion page body (blocks converted to markdown)';

-- Optional: Remove raw_content if no longer needed (uncomment if desired)
-- ALTER TABLE public.incoming_contents DROP COLUMN IF EXISTS raw_content;
