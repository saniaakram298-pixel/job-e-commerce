import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'atelier_session';
export const AUTH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret(): string | null {
  return process.env.NEXTAUTH_SECRET || null;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET must be configured before issuing authentication tokens');
  }
  return jwt.sign({ userId }, secret, { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS });
}

export function verifyToken(token: string): { userId: string } | null {
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'object' && decoded !== null && typeof decoded.userId === 'string') {
      return { userId: decoded.userId };
    }
    return null;
  } catch {
    return null;
  }
}
