import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { publishToTelegram, sendAdminNotification } from '@/lib/telegram';
import { publishToThreads } from '@/lib/threads';
import { formatForTelegram, formatForThreads } from '@/lib/text-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCronPublish(req);
}

export async function POST(req: NextRequest) {
  return handleCronPublish(req);
}

async function handleCronPublish(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyParam = searchParams.get('key');
  const authHeader = req.headers.get('authorization');

  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized =
    !cronSecret ||
    keyParam === cronSecret ||
    authHeader === `Bearer ${cronSecret}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Неверный ключ CRON' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    // 1. Fetch posts ready for publication
    const { data: duePosts, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .limit(10); // Batch size

    if (fetchError) {
      console.error('[Cron Fetch Error]:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        message: 'Нет постов, ожидающих публикации.',
        processed: 0,
      });
    }

    const results = [];

    for (const post of duePosts) {
      // Mark as publishing immediately to prevent duplicate runs
      await supabase
        .from('posts')
        .update({ status: 'publishing', updated_at: new Date().toISOString() })
        .eq('id', post.id);

      const tgHtml = formatForTelegram(post.content_html);
      const threadsText = post.threads_custom_text?.trim()
        ? post.threads_custom_text.trim()
        : formatForThreads(post.content_html);

      let tgMessageId: string | undefined;
      let threadsPostId: string | undefined;
      const errors: string[] = [];

      // Publish to Telegram
      if (post.publish_to_telegram) {
        const tgRes = await publishToTelegram({
          htmlContent: tgHtml,
          mediaUrl: post.media_url,
        });
        if (tgRes.success) {
          tgMessageId = tgRes.messageId;
        } else {
          errors.push(`TG: ${tgRes.error}`);
        }
      }

      // Publish to Threads
      if (post.publish_to_threads) {
        const threadsRes = await publishToThreads({
          text: threadsText,
          mediaUrl: post.media_url,
        });
        if (threadsRes.success) {
          threadsPostId = threadsRes.postId;
        } else {
          errors.push(`Threads: ${threadsRes.error}`);
        }
      }

      const hasError = errors.length > 0;
      const finalStatus = hasError ? 'failed' : 'published';
      const errorMessage = hasError ? errors.join('; ') : null;

      // Update post in DB
      await supabase
        .from('posts')
        .update({
          status: finalStatus,
          telegram_message_id: tgMessageId || null,
          threads_post_id: threadsPostId || null,
          error_message: errorMessage,
          published_at: hasError ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Send owner notification
      if (hasError) {
        await sendAdminNotification(
          `⚠️ <b>Ошибка автопостинга:</b> "${post.title}"\n${errorMessage}`
        );
      } else {
        await sendAdminNotification(
          `🚀 <b>Опубликовано по расписанию:</b> "${post.title}"\nКаналы: ${post.publish_to_telegram ? 'Telegram ' : ''}${post.publish_to_threads ? 'Threads' : ''}`
        );
      }

      results.push({
        id: post.id,
        title: post.title,
        status: finalStatus,
        error: errorMessage,
      });
    }

    return NextResponse.json({
      message: `Обработано ${results.length} постов`,
      processed: results.length,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron Execution Error]:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
