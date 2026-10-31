import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthenticated } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('channels').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAuthenticated()) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const supabase = getServiceSupabase();

    const { data: channel, error } = await supabase
      .from('channels')
      .update(body)
      .eq('id', params.id)
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
