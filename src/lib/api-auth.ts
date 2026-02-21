// Helper to get companyId from request headers (set by middleware)
// SUPER_ADMIN can override companyId via ?companyId= query param

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth';

/**
 * Returns the effective companyId for data scoping.
 * - Regular users: always their own companyId from JWT.
 * - SUPER_ADMIN: if ?companyId= is provided, uses that; otherwise returns their own.
 */
export function getCompanyId(request: NextRequest): string {
  const companyId = request.headers.get('x-company-id');
  if (!companyId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const role = request.headers.get('x-user-role') || '';

  // Super admin can act on behalf of any company
  if (isSuperAdmin(role)) {
    const { searchParams } = new URL(request.url);
    const targetCompanyId = searchParams.get('companyId');
    if (targetCompanyId) return targetCompanyId;
  }

  return companyId;
}

/**
 * For queries that should return ALL data for super admin
 * (e.g., listing customers across all companies).
 * Returns undefined for super admin (no filter), companyId for others.
 */
export function getCompanyFilter(request: NextRequest): string | undefined {
  const role = request.headers.get('x-user-role') || '';
  if (isSuperAdmin(role)) {
    const { searchParams } = new URL(request.url);
    const targetCompanyId = searchParams.get('companyId');
    return targetCompanyId || undefined; // undefined = all companies
  }
  return getCompanyId(request);
}

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return userId;
}

export function getUserRole(request: NextRequest): string {
  return request.headers.get('x-user-role') || '';
}

export function requireSuperAdmin(request: NextRequest): void {
  const role = getUserRole(request);
  if (!isSuperAdmin(role)) {
    throw new Error('FORBIDDEN');
  }
}

export function authError() {
  return NextResponse.json(
    { error: 'No autenticado' },
    { status: 401 }
  );
}

export function forbiddenError() {
  return NextResponse.json(
    { error: 'No tiene permisos para esta acción' },
    { status: 403 }
  );
}
