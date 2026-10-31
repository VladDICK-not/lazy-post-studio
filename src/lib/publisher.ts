import { SupabaseClient } from '@supabase/supabase-js';
import { Post, Channel } from '@/lib/types';
import { publishToTelegram } from '@/lib/telegram';
import { publishToThreads } from '@/lib/threads';
import { formatForTelegram, formatForThreads } from '@/lib/text-helpers';

export interface PublishResult {
  allSuccess: boolean;
  errors: string[];
  tgMessageId?: string;
  threadsPostId?: string;
}

export async function executePostPublish(
  post: Post,
  supabase: SupabaseClient
): Promise<PublishResult> {
  const tgHtml = formatForTelegram(post.content_html);
  const threadsText = post.threads_custom_text?.trim()
    ? post.threads_custom_text.trim()
    : formatForThreads(post.content_html);

  const errors: string[] = [];
  let tgMessageId: string | undefined;
  let threadsPostId: string | undefined;

  // Check if specific channels from the database were targeted
  if (post.target_channel_ids && post.target_channel_ids.length > 0) {
    const { data: channels } = await supabase
      .from('channels')
      .select('*')
      .in('id', post.target_channel_ids)
      .eq('is_active', true);

    const activeChannels: Channel[] = channels || [];

    if (activeChannels.length === 0) {
      errors.push('Выбранные каналы не найдены или отключены.');
    }

    for (const channel of activeChannels) {
      if (channel.platform === 'telegram') {
        const botToken = channel.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
        const channelId = channel.telegram_channel_id || process.env.TELEGRAM_CHANNEL_ID;

        const res = await publishToTelegram({
          htmlContent: tgHtml,
          mediaUrl: post.media_url,
          botToken,
          channelId,
        });

        if (res.success) {
          tgMessageId = res.messageId;
        } else {
          errors.push(`[${channel.name}] Telegram: ${res.error}`);
        }
      } else if (channel.platform === 'threads') {
        const userId = channel.threads_user_id || process.env.THREADS_USER_ID;
        const token = channel.threads_access_token || process.env.THREADS_ACCESS_TOKEN;

        const res = await publishToThreads({
          text: threadsText,
          mediaUrl: post.media_url,
          userId,
          accessToken: token,
        });

        if (res.success) {
          threadsPostId = res.postId;
        } else {
          errors.push(`[${channel.name}] Threads: ${res.error}`);
        }
      }
    }
  } else {
    // Fallback: publish to default channels from .env
    if (post.publish_to_telegram) {
      const res = await publishToTelegram({
        htmlContent: tgHtml,
        mediaUrl: post.media_url,
      });
      if (res.success) {
        tgMessageId = res.messageId;
      } else {
        errors.push(`Telegram: ${res.error}`);
      }
    }

    if (post.publish_to_threads) {
      const res = await publishToThreads({
        text: threadsText,
        mediaUrl: post.media_url,
      });
      if (res.success) {
        threadsPostId = res.postId;
      } else {
        errors.push(`Threads: ${res.error}`);
      }
    }
  }

  return {
    allSuccess: errors.length === 0,
    errors,
    tgMessageId,
    threadsPostId,
  };
}
