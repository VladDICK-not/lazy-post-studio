-- Schema for Cross-Post Studio
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  scheduled_at timestamptz not null,
  
  title text not null,
  content_html text not null,          -- Formatted HTML for Telegram
  content_plain text not null,         -- Clean plain text for Threads/fallback
  threads_custom_text text,            -- Optional custom override text for Threads (< 500 chars)
  media_url text,                      -- Image URL (Supabase storage or external)
  
  -- Target platforms
  publish_to_telegram boolean default true not null,
  publish_to_threads boolean default true not null,
  
  -- Status tracking: 'draft', 'scheduled', 'publishing', 'published', 'failed'
  status text not null check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')) default 'scheduled',
  
  -- Results and logs
  telegram_message_id text,
  threads_post_id text,
  error_message text,
  published_at timestamptz
);

-- Index for fast cron queries
create index if not exists idx_posts_cron on public.posts (status, scheduled_at);

-- Set up Supabase Storage Bucket for media
insert into storage.buckets (id, name, public) 
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Storage public read policy
create policy "Public Access to Post Media"
on storage.objects for select
using (bucket_id = 'post-media');

-- Service role / authenticated write policy
create policy "Service Role upload Post Media"
on storage.objects for insert
with check (bucket_id = 'post-media');
