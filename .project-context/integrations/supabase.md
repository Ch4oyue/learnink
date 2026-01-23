create table public.incoming_contents (
  id uuid not null default gen_random_uuid (),
  title text not null,
  content text null, -- Markdown content from Notion page body
  raw_content jsonb not null default '{}'::jsonb, -- Deprecated, kept for backward compatibility
  source text null default 'n8n'::text,
  status text null default 'pending'::text,
  integration_id uuid null,
  processed_at timestamp with time zone null,
  processed_by uuid null,
  created_at timestamp with time zone null default now(),
  summary text null,
  level text null,
  track text null,
  category text null,
  constraint incoming_contents_pkey primary key (id),
  constraint incoming_contents_integration_id_fkey foreign KEY (integration_id) references integrations (id),
  constraint incoming_contents_processed_by_fkey foreign KEY (processed_by) references auth.users (id),
  constraint incoming_contents_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;