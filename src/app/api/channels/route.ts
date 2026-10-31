import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthenticated } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ channels: channels || [] });
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
    const body = await req.json();
    const {
      name,
      platform,
      telegram_channel_id,
      telegram_bot_token,
      threads_user_id,
      threads_access_token,
    } = body;

    if (!name || !platform) {
      return NextResponse.json({ error: 'Имя и платформа обязательны' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        name: name.trim(),
        platform,
        is_active: true,
        telegram_channel_id: telegram_channel_id?.trim() || null,
        telegram_bot_token: telegram_bot_token?.trim() || null,
        threads_user_id: threads_user_id?.trim() || null,
        threads_access_token: threads_access_token?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, channel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
