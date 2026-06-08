import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function getExpectedToken(): Promise<string> {
  const password = process.env.APP_PASSWORD || 'contascasa2026';
  const secret = process.env.SESSION_SECRET || 'contascasa-secret-2026';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API auth routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('session');
  const expectedToken = await getExpectedToken();

  if (!session || session.value !== expectedToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
