import { createHash } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export function hashPassword(password: string): string {
  const secret = process.env.SESSION_SECRET || 'contascasa-secret-2026';
  return createHash('sha256').update(password + secret).digest('hex');
}

export function getExpectedSessionToken(): string {
  const password = process.env.APP_PASSWORD || 'contascasa2026';
  return hashPassword(password);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  return session.value === getExpectedSessionToken();
}

export async function setSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, getExpectedSessionToken(), {
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
