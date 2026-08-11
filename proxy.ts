import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fallback-key-change-in-production'
);

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that do not require authentication
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');

  // Check for the session cookie
  const token = request.cookies.get('nexmx_session')?.value;

  // Verify token if it exists
  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValid = true;
    } catch (err) {
      isValid = false;
    }
  }

  // If path is protected and token is missing or invalid, redirect to /login
  if (!isPublicPath && !isValid) {
    // If it's an API route, return 401 instead of redirecting
    if (path.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is already authenticated and visits /login, redirect to dashboard
  if (path === '/login' && isValid) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to everything except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
