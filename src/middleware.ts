import { NextRequest, NextResponse } from 'next/server';

const TOKEN_NAME = 'hunter-token';

// Public paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/health', '/api/setup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode JWT payload without full crypto verification (Edge Runtime compatible)
  // Full verification happens in API routes/server components via auth.ts
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-company-id', payload.companyId || '');
    requestHeaders.set('x-user-id', payload.userId || '');
    requestHeaders.set('x-user-role', payload.role || '');

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
