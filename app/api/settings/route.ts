import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';
import { getShopifyConnectionInfo } from '../../../lib/shopify/admin';

// Settings keys that must never be sent to the browser: live API credentials.
// Returning these client-side would let them leak into browser devtools, error
// monitoring, or logs. The UI reports whether each one is configured (see
// `configured` below) and can overwrite it, but can never read it back.
const SENSITIVE_SETTINGS_KEYS = new Set([
  'shopify_token',
  'openrouter_key',
  'higgsfield_key',
]);

// Sensitive keys the operator may still set from the settings UI. They are
// write-only: accepted on POST, never returned on GET.
const CLIENT_WRITABLE_SECRET_KEYS = ['openrouter_key', 'higgsfield_key'];

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

  // Whether each secret has a stored value - a boolean, never the value itself.
  // Lets the UI show "configuré" without ever transmitting the credential.
  const configured: Record<string, boolean> = Object.fromEntries(
    CLIENT_WRITABLE_SECRET_KEYS.map((key) => [key, false])
  );
  configured.openrouter_key_env = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  try {
    const db = getDbConnection();
    const result = await db.execute('SELECT * FROM settings');

    for (const row of result.rows as unknown as { key: string; value: string }[]) {
      const key = row.key;
      const value = row.value;

      if (SENSITIVE_SETTINGS_KEYS.has(key)) {
        if (key in configured) {
          configured[key] = Boolean(value?.trim());
        }
        continue;
      }
      if (key === 'shopify_url') continue;

      settings[key] = value;
    }
  } catch (error) {
    settingsAvailable = false;
    console.error('Settings database unavailable; returning Shopify state only', error);
  }

  return NextResponse.json({
    success: true,
    settings,
    shopify,
    settingsAvailable,
    configured,
  });
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
      if (typeof value !== 'string') continue;

      // A blank secret field means "leave it as it is", not "erase it". The UI
      // cannot read the stored value back, so an empty submit must not wipe it.
      if (CLIENT_WRITABLE_SECRET_KEYS.includes(key) && value.trim() === '') {
        continue;
      }

      statements.push({
        sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }

    if (statements.length > 0) {
      await db.batch(statements, 'write');
    }

    return NextResponse.json({ success: true, saved: statements.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to save settings', error);
    return NextResponse.json(
      {
        success: false,
        error: `Impossible d'enregistrer les paramètres: ${message}`,
      },
      { status: 500 }
    );
  }
}
