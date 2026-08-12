import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';
import { getShopifyConnectionInfo } from '../../../lib/shopify/admin';

// Settings keys that must never be sent to the browser. shopify_token is the
// live Shopify Admin API access token; exposing it client-side would let it
// leak into browser devtools, error monitoring, or logs.
const SENSITIVE_SETTINGS_KEYS = new Set(['shopify_token']);

// Settings keys that are only ever written by trusted server-side flows (the
// OAuth callback), never accepted from client input.
const SERVER_MANAGED_SETTINGS_KEYS = new Set(['shopify_token', 'shopify_url']);

export async function GET(): Promise<Response> {
  // Shopify state comes from environment variables only - no database involved -
  // so it is resolved first and independently. The settings page needs it to
  // render the connection panel and the "Tester la connexion" button even when
  // the database is unavailable.
  const shopify = await getShopifyConnectionInfo();

  const settings: Record<string, string> = {};
  if (shopify.shop) {
    settings.shopify_url = shopify.shop;
  }

  // The remaining settings (AI provider keys) live in the database. A database
  // that is unreachable degrades this to "no saved keys" rather than failing the
  // whole request and taking the Shopify panel down with it.
  let settingsAvailable = true;
  try {
    const db = getDbConnection();
    const result = await db.execute('SELECT * FROM settings');

    for (const row of result.rows as any[]) {
      const key = row.key as string;
      if (SENSITIVE_SETTINGS_KEYS.has(key) || key === 'shopify_url') {
        continue;
      }
      settings[key] = row.value as string;
    }
  } catch (error) {
    settingsAvailable = false;
    console.error('Settings database unavailable; returning Shopify state only', error);
  }

  return NextResponse.json({ success: true, settings, shopify, settingsAvailable });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const data = await request.json();
    const db = getDbConnection();
    
    const statements = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (SERVER_MANAGED_SETTINGS_KEYS.has(key)) {
        // The Shopify access token and store domain are only ever written by
        // trusted server-side flows (the OAuth callback) or supplied via
        // environment variables - never accepted from client input.
        continue;
      }
      if (typeof value === 'string') {
        statements.push({
          sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          args: [key, value]
        });
      }
    }
    
    if (statements.length > 0) {
      await db.batch(statements, 'write');
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
