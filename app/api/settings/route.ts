import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';

export async function GET(): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const db = getDbConnection();
    db.all('SELECT * FROM settings', (err, rows) => {
      db.close();
      if (err) {
        resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
        return;
      }
      const settings = (rows || []).reduce((acc: Record<string, string>, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      
      resolve(NextResponse.json({ success: true, settings }));
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const data = await request.json();
    return new Promise<Response>((resolve) => {
      const db = getDbConnection();
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            stmt.run(key, value);
          }
        }
        
        stmt.finalize();
        
        db.run('COMMIT', (err: Error | null) => {
          db.close();
          if (err) {
            resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
            return;
          }
          resolve(NextResponse.json({ success: true }));
        });
      });
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
