import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';

// Settings keys that must never be sent to the browser. shopify_token is the
// live Shopify Admin API access token; exposing it client-side would let it
// leak into browser devtools, error monitoring, or logs.
const SENSITIVE_SETTINGS_KEYS = new Set(['shopify_token']);

export async function GET(): Promise<Response> {
  try {
    const db = getDbConnection();
    const result = await db.execute('SELECT * FROM settings');
    
    const settings = result.rows.reduce((acc: Record<string, string>, row: any) => {
      const key = row.key as string;
      if (SENSITIVE_SETTINGS_KEYS.has(key)) {
        return acc;
      }
      acc[key] = row.value as string;
      return acc;
    }, {});
    
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const data = await request.json();
    const db = getDbConnection();
    
    const statements = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_SETTINGS_KEYS.has(key)) {
        // Sensitive settings (e.g. the Shopify access token) are only ever
        // written by trusted server-side flows (the OAuth callback), never
        // accepted from client input.
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
