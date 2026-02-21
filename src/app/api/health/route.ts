import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/health - Diagnostic endpoint (no auth required)
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ configured' : '❌ missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ configured' : '❌ missing',
      PORT: process.env.PORT || 'not set',
    },
  };

  // Check database connection
  try {
    const companyCount = await prisma.company.count();
    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();
    checks.database = {
      status: '✅ connected',
      companies: companyCount,
      users: userCount,
      customers: customerCount,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    checks.database = {
      status: '❌ error',
      error: message,
    };
  }

  // Check if seed data exists
  try {
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@autofix.com' },
      select: { id: true, email: true, name: true, companyId: true },
    });
    checks.seedData = testUser
      ? { status: '✅ found', user: testUser.email }
      : { status: '❌ no seed data - run: npx prisma db seed' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    checks.seedData = { status: '❌ error', error: message };
  }

  const allOk =
    checks.database &&
    typeof checks.database === 'object' &&
    'status' in checks.database &&
    (checks.database as { status: string }).status.includes('✅') &&
    checks.seedData &&
    typeof checks.seedData === 'object' &&
    'status' in checks.seedData &&
    (checks.seedData as { status: string }).status.includes('✅');

  return NextResponse.json(
    { ok: allOk, ...checks },
    { status: allOk ? 200 : 503 }
  );
}
