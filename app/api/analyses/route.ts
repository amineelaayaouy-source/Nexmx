import { NextResponse } from 'next/server';
import { isRemoteDatabase } from '../../../db';
import { latestAnalysisByProduct, listAnalyses } from '../../../lib/analyses/store';

/**
 * GET /api/analyses
 *
 *   ?view=summary  the latest analysis per product, keyed by Shopify product id.
 *                  Used by the product grid to mark what is already analysed.
 *   (default)      every saved analysis, newest first, with ?limit and ?offset.
 *
 * Behind the session cookie via proxy.ts.
 */

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  try {
    if (searchParams.get('view') === 'summary') {
      const byProduct = await latestAnalysisByProduct();
      return NextResponse.json({ success: true, byProduct });
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const analyses = await listAnalyses(limit, offset);
    return NextResponse.json({ success: true, analyses });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Could not read saved analyses:', error);

    // Without a remote database, a deployed instance has nowhere to write - the
    // Vercel filesystem is read-only. Say so plainly instead of surfacing a raw
    // SQLite error the operator cannot act on.
    return NextResponse.json(
      {
        success: false,
        error: message,
        code: isRemoteDatabase() ? 'DB_ERROR' : 'DB_NOT_CONFIGURED',
      },
      { status: 500 }
    );
  }
}
