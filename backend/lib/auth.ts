import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'luxe-store-super-secret-key-123';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuthFromRequest(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): TokenPayload {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  return auth;
}

export function requireAdmin(request: NextRequest): TokenPayload {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  if (auth.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return auth;
}
