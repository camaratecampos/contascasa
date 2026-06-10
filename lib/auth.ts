import { createHash } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export function hashPassword(password: string, secret: string): string {
  return createHash('sha256').update(password + secret).digest('hex');
}

// Returns null when credentials are not configured, so auth fails closed
export function getExpectedSessionToken(): string | null {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) return null;
  return hashPassword(password, secret);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  const expected = getExpectedSessionToken();
  return expected !== null && session.value === expected;
}

export async function setSession(): Promise<void> {
  const token = getExpectedSessionToken();
  if (!token) {
    throw new Error('APP_PASSWORD e SESSION_SECRET têm de estar configurados');
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
