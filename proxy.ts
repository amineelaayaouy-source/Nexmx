import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './lib/auth/jwt-secret';

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
      // Throws if JWT_SECRET is not configured - treated as an invalid
      // token below, so a missing secret fails closed (denies access)
      // instead of falling back to a hardcoded/default secret.
      const secret = getJwtSecret();
      await jwtVerify(token, secret);
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
