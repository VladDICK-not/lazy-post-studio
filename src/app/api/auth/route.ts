import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getSessionToken, SESSION_COOKIE_NAME, isRequestAuthenticated } from '@/lib/auth';

export async function GET() {
  const authenticated = isRequestAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Неверный мастер-пароль' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only secure cookie valid for 30 days
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: getSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
