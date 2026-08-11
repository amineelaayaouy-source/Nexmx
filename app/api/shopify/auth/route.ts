import { NextResponse } from 'next/server';
import { getShopifyAuthParams, generateState, sanitizeShopDomain } from '../../../../lib/shopify/oauth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawShop = searchParams.get('shop');

  if (!rawShop) {
    return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
  }

  const shop = sanitizeShopDomain(rawShop);
  if (!shop) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }

  const { apiKey, scopes, redirectUri } = getShopifyAuthParams();

  if (!apiKey) {
    return NextResponse.json({ error: 'Shopify App not configured in Environment Variables' }, { status: 500 });
  }

  const state = generateState();
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const response = NextResponse.redirect(installUrl);
  
  // Store state in an HTTP-only cookie for validation on callback
  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
