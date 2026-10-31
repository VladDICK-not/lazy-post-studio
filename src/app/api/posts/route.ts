import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthenticated } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/telegram';
import { executePostPublish } from '@/lib/publisher';
import { CreatePostInput } from '@/lib/types';

export async function GET() {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const body: CreatePostInput = await req.json();
    const {
      title,
      content_html,
      content_plain,
      threads_custom_text,
      media_url,
      scheduled_at,
      publish_to_telegram,
      publish_to_threads,
      target_channel_ids = [],
      publish_now,
    } = body;

    if (!title || !content_html) {
      return NextResponse.json({ error: 'Заголовок и текст обязательны' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (publish_now) {
      // 1. Insert as publishing
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          title,
          content_html,
          content_plain,
          threads_custom_text: threads_custom_text || null,
          media_url: media_url || null,
          scheduled_at: new Date().toISOString(),
          publish_to_telegram,
          publish_to_threads,
          target_channel_ids,
          status: 'publishing',
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Execute publish
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

      // Send admin notification
      if (hasError) {
        await sendAdminNotification(
          `⚠️ <b>Ошибка публикации поста:</b> "${title}"\n\nПричина: ${errorMessage}`
        );
      } else {
        await sendAdminNotification(
          `✅ <b>Пост опубликован:</b> "${title}"`
        );
      }

      return NextResponse.json({
        success: !hasError,
        post: { ...post, status: finalStatus, error_message: errorMessage },
        error: errorMessage,
      });
    } else {
      // Regular Schedule
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          title,
          content_html,
          content_plain,
          threads_custom_text: threads_custom_text || null,
          media_url: media_url || null,
          scheduled_at: scheduled_at || new Date().toISOString(),
          publish_to_telegram,
          publish_to_threads,
          target_channel_ids,
          status: 'scheduled',
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, post });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
