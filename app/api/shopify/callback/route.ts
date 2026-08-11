import { NextResponse } from 'next/server';
import { getShopifyAuthParams, verifyHmac, exchangeAccessToken } from '../../../../lib/shopify/oauth';
import { getDbConnection } from '../../../../db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!shop || !code || !state) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // 1. Validate State
  const cookieState = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('shopify_oauth_state='))?.split('=')[1];
  
  if (state !== cookieState) {
    return NextResponse.json({ error: 'Invalid State (CSRF prevention)' }, { status: 403 });
  }

  const { apiKey, apiSecret } = getShopifyAuthParams();

  // 2. Validate HMAC
  if (!verifyHmac(searchParams, apiSecret)) {
    return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 403 });
  }

  // 3. Exchange Code for Access Token
  const accessToken = await exchangeAccessToken(shop, code, apiKey, apiSecret);

  if (!accessToken) {
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }

  // 4. Save to Database
  try {
    const db = getDbConnection();
    
    // Using batch for atomic transaction
    await db.batch([
      {
        sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        args: ['shopify_url', shop]
      },
      {
        sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        args: ['shopify_token', accessToken] // Offline Token
      }
    ], 'write');
    
  } catch (dbError) {
    console.error('Failed to save Shopify credentials', dbError);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  // 5. Redirect back to settings page
  const response = NextResponse.redirect(new URL('/settings?shopify=connected', request.url));
  
  // Clean up state cookie
  response.cookies.delete('shopify_oauth_state');
  
  return response;
}
