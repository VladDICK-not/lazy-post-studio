import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthenticated } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { publishToTelegram, sendAdminNotification } from '@/lib/telegram';
import { publishToThreads } from '@/lib/threads';
import { formatForTelegram, formatForThreads } from '@/lib/text-helpers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('posts').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Retry or trigger publish for a specific post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    const tgHtml = formatForTelegram(post.content_html);
    const threadsText = post.threads_custom_text?.trim()
      ? post.threads_custom_text.trim()
      : formatForThreads(post.content_html);

    let tgMessageId: string | undefined;
    let threadsPostId: string | undefined;
    const errors: string[] = [];

    if (post.publish_to_telegram) {
      const tgRes = await publishToTelegram({
        htmlContent: tgHtml,
        mediaUrl: post.media_url,
      });
      if (tgRes.success) {
        tgMessageId = tgRes.messageId;
      } else {
        errors.push(`Telegram: ${tgRes.error}`);
      }
    }

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

    await supabase
      .from('posts')
      .update({
        status: finalStatus,
        telegram_message_id: tgMessageId || post.telegram_message_id,
        threads_post_id: threadsPostId || post.threads_post_id,
        error_message: errorMessage,
        published_at: hasError ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    if (hasError) {
      await sendAdminNotification(
        `⚠️ <b>Ошибка при повторной публикации:</b> "${post.title}"\n${errorMessage}`
      );
    } else {
      await sendAdminNotification(
        `✅ <b>Пост опубликован:</b> "${post.title}"`
      );
    }

    return NextResponse.json({
      success: !hasError,
      status: finalStatus,
      error: errorMessage,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
