export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type PlatformType = 'telegram' | 'threads';

export interface Channel {
  id: string;
  created_at: string;
  name: string;
  platform: PlatformType;
  is_active: boolean;
  telegram_channel_id?: string | null;
  telegram_bot_token?: string | null;
  threads_user_id?: string | null;
  threads_access_token?: string | null;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  scheduled_at: string;
  title: string;
  content_html: string;
  content_plain: string;
  threads_custom_text?: string | null;
  media_url?: string | null;
  publish_to_telegram: boolean;
  publish_to_threads: boolean;
  target_channel_ids?: string[];
  status: PostStatus;
  telegram_message_id?: string | null;
  threads_post_id?: string | null;
  error_message?: string | null;
  published_at?: string | null;
}

export interface CreatePostInput {
  title: string;
  content_html: string;
  content_plain: string;
  threads_custom_text?: string | null;
  media_url?: string | null;
  scheduled_at: string;
  publish_to_telegram: boolean;
  publish_to_threads: boolean;
  target_channel_ids?: string[];
  publish_now?: boolean;
}
