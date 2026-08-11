import crypto from 'crypto';

export function getShopifyAuthParams() {
  const apiKey = process.env.SHOPIFY_API_KEY || '';
  const apiSecret = process.env.SHOPIFY_API_SECRET || '';
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_inventory,read_orders,read_customers';
  const appUrl = process.env.SHOPIFY_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const redirectUri = `${appUrl}/api/shopify/callback`;

  return { apiKey, apiSecret, scopes, redirectUri };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyHmac(query: URLSearchParams, apiSecret: string): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;

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
