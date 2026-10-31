import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/telegram';
import { executePostPublish } from '@/lib/publisher';

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
      .limit(10);

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

      const publishResult = await executePostPublish(post, supabase);
      const hasError = !publishResult.allSuccess;
      const finalStatus = hasError ? 'failed' : 'published';
      const errorMessage = hasError ? publishResult.errors.join('; ') : null;

      // Update post in DB
      await supabase
        .from('posts')
        .update({
          status: finalStatus,
          telegram_message_id: publishResult.tgMessageId || null,
          threads_post_id: publishResult.threadsPostId || null,
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
          `🚀 <b>Опубликовано по расписанию:</b> "${post.title}"`
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
