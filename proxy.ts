import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './lib/auth/jwt-secret';

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Shopify OAuth entry points. These must stay publicly reachable:
  // - /api/shopify/auth is where a merchant starts the install/OAuth flow,
  //   before any Nexmx session cookie can exist.
  // - /api/shopify/callback is where Shopify redirects the merchant back
  //   to after granting access; Shopify calls this directly, with no
  //   Nexmx session cookie attached.
  // Only these two exact routes are exempted - other /api/shopify/* routes
  // (e.g. disconnect, the extraction endpoint) remain behind auth like the
  // rest of the dashboard.
  const isPublicShopifyOAuthRoute =
    path === '/api/shopify/auth' || path === '/api/shopify/callback';

  // Public paths that do not require authentication
  const isPublicPath =
    path === '/login' ||
    path.startsWith('/api/auth') ||
    isPublicShopifyOAuthRoute;

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
