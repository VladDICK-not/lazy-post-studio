import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthenticated } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/telegram';
import { executePostPublish } from '@/lib/publisher';

export const dynamic = 'force-dynamic';

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

    const publishResult = await executePostPublish(post, supabase);
    const hasError = !publishResult.allSuccess;
    const finalStatus = hasError ? 'failed' : 'published';
    const errorMessage = hasError ? publishResult.errors.join('; ') : null;

    await supabase
      .from('posts')
      .update({
        status: finalStatus,
        telegram_message_id: publishResult.tgMessageId || post.telegram_message_id,
        threads_post_id: publishResult.threadsPostId || post.threads_post_id,
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
