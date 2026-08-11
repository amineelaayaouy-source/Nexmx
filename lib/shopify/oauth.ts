import crypto from 'crypto';

export function getShopifyAuthParams() {
  const apiKey = process.env.SHOPIFY_API_KEY || '';
  const apiSecret = process.env.SHOPIFY_API_SECRET || '';
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_inventory,read_orders,read_customers';
  // NOTE: operator precedence matters here. `a || b ? x : y` parses as `(a || b) ? x : y`,
  // which silently ignored SHOPIFY_APP_URL and always built the URL from the per-deployment
  // VERCEL_URL hostname (which changes on every deploy and never matches the callback URL
  // whitelisted in the Shopify app). Resolve explicitly instead.
  const appUrl = (
    process.env.SHOPIFY_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  const redirectUri = `${appUrl}/api/shopify/callback`;

  return { apiKey, apiSecret, scopes, redirectUri };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyHmac(query: URLSearchParams, apiSecret: string): boolean {
  const hmac = query.get('hmac');
  if (!hmac || !apiSecret) return false;

  const map = new Map<string, string>();
  query.forEach((value, key) => {
    if (key !== 'hmac' && key !== 'signature') {
      map.set(key, value);
    }
  });

  const sortedKeys = Array.from(map.keys()).sort();
  const message = sortedKeys.map((key) => `${key}=${map.get(key)}`).join('&');

  const generatedHash = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');

  // timingSafeEqual throws on length mismatch, which would surface as an unhandled 500
  if (generatedHash.length !== hmac.length) return false;

  // Time-safe string comparison
  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmac)
  );
}

export async function exchangeAccessToken(shop: string, code: string, apiKey: string, apiSecret: string): Promise<string | null> {
  const url = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    console.error('Failed to exchange access token', await response.text());
    return null;
  }

  const data = await response.json();
  return data.access_token || null;
}

export function sanitizeShopDomain(shop: string): string | null {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (regex.test(shop)) {
    return shop;
  }
  
  // If user just typed "storename"
  if (/^[a-zA-Z0-9][a-zA-Z0-9\-]*$/.test(shop)) {
    return `${shop}.myshopify.com`;
  }
  
  return null;
}
