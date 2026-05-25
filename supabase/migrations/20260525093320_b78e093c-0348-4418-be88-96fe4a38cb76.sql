ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_channel_id text,
  ADD COLUMN IF NOT EXISTS author_channel_url text;