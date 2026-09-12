import { NextResponse } from 'next/server';
import { deleteAnalysis, getAnalysis } from '../../../../lib/analyses/store';

/**
 * GET    /api/analyses/:id   one saved analysis with its full result
 * DELETE /api/analyses/:id   remove it
 *
 * Behind the session cookie via proxy.ts.
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;

  try {
    const saved = await getAnalysis(id);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Analyse introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not read analysis ${id}:`, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;

  try {
    const removed = await deleteAnalysis(id);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Analyse introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not delete analysis ${id}:`, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
