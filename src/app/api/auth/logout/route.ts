import { NextResponse } from 'next/server';
import { TOKEN_NAME } from '@/lib/auth';

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada' });
  response.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
