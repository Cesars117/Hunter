// Helper to get companyId from request headers (set by middleware)

import { NextRequest, NextResponse } from 'next/server';

export function getCompanyId(request: NextRequest): string {
  const companyId = request.headers.get('x-company-id');
  if (!companyId) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return companyId;
}

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return userId;
}

export function authError() {
  return NextResponse.json(
    { error: 'No autenticado' },
    { status: 401 }
  );
}
