-- Schema for Lazy-Post Studio
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Table for multiple channels and accounts (Telegram & Threads)
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,                           -- e.g. "IT Новости", "@vlad_threads"
  platform text not null check (platform in ('telegram', 'threads')),
  is_active boolean default true not null,
  
  -- Telegram credentials
  telegram_channel_id text,                     -- e.g. "@my_channel" or "-100..."
  telegram_bot_token text,                      -- Optional custom bot token (uses .env if null)
  
  -- Threads credentials
  threads_user_id text,                         -- Threads User ID
  threads_access_token text                     -- Threads Long-Lived Access Token
);

-- 2. Posts Table
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
  
  -- Target platform flags & specific channel IDs
  publish_to_telegram boolean default true not null,
  publish_to_threads boolean default true not null,
  target_channel_ids uuid[] default '{}'::uuid[] not null, -- Array of selected channel UUIDs
  
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

-- 3. Storage Bucket for Media
insert into storage.buckets (id, name, public) 
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "Public Access to Post Media"
on storage.objects for select
using (bucket_id = 'post-media');

create policy "Service Role upload Post Media"
on storage.objects for insert
with check (bucket_id = 'post-media');
