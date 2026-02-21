import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET /api/auth/me - Get current session
export async function GET() {
  try {
    const session = getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        companyId: session.companyId,
        companyName: session.companyName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
}
