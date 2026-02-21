// Authentication utilities for Hunter

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'hunter-secret-key-change-in-production';
const TOKEN_NAME = 'hunter-token';
const TOKEN_EXPIRY = '7d';

// Roles: SUPER_ADMIN can see/edit ALL companies. ADMIN/MANAGER/TECH are tenant-scoped.
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TECH';

export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
  companyName: string;
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Get current session from cookies (for server components / API routes)
export function getSession(): JWTPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Get companyId from the current session (throws if not authenticated)
export function requireAuth(): JWTPayload {
  const session = getSession();
  if (!session) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return session;
}

export { TOKEN_NAME };
