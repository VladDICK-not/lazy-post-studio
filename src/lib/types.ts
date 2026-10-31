export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

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
  publish_now?: boolean;
}
