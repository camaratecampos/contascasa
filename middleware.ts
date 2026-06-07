import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';

function getExpectedToken(): string {
  const password = process.env.APP_PASSWORD || 'contascasa2026';
  const secret = process.env.SESSION_SECRET || 'contascasa-secret-2026';
  return createHash('sha256').update(password + secret).digest('hex');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API auth routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('session');
  const expectedToken = getExpectedToken();

  if (!session || session.value !== expectedToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
