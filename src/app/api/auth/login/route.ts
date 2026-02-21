import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken, TOKEN_NAME } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!user.company.isActive) {
      return NextResponse.json(
        { error: 'La empresa está desactivada. Contacte al administrador.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.company.name,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company.name,
      },
    });

    // Detect if request is over HTTPS (works behind proxies too)
    const isHttps = request.headers.get('x-forwarded-proto') === 'https' ||
                    request.url.startsWith('https://');

    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Login error:', message);
    return NextResponse.json(
      { error: 'Error al iniciar sesión', detail: message },
      { status: 500 }
    );
  }
}
