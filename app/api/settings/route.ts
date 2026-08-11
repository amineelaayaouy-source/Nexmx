import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';

export async function GET(): Promise<Response> {
  try {
    const db = getDbConnection();
    const result = await db.execute('SELECT * FROM settings');
    
    const settings = result.rows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.key as string] = row.value as string;
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
