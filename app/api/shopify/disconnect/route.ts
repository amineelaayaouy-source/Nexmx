import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../db';

export async function POST(request: Request) {
  try {
    const db = getDbConnection();
    
    // Using batch to securely remove both settings at once
    await db.batch([
      {
        sql: 'DELETE FROM settings WHERE key = ?',
        args: ['shopify_url']
      },
      {
        sql: 'DELETE FROM settings WHERE key = ?',
        args: ['shopify_token']
      }
    ], 'write');
    
    return NextResponse.json({ success: true, message: 'Shopify disconnected successfully' });
  } catch (error: any) {
    console.error('Failed to disconnect Shopify', error);
    return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 });
  }
}
