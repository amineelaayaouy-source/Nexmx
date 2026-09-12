import { randomUUID } from 'crypto';
import { ensureDatabaseReady, getDbConnection } from '../../db';
import { parseAnalysisResult, type AnalysisResult, type Verdict } from '../ai/analysis';

/**
 * Persistence for product analyses.
 *
 * An analysis costs a model call and a minute of waiting, so it is stored the
 * moment it is produced and read back from here afterwards. Nothing in the UI
 * should ever have to re-run an analysis just to look at it again.
 */

export interface SavedAnalysisSummary {
  id: string;
  productId: string | null;
  productTitle: string;
  productImage: string | null;
  productPrice: string | null;
  productCurrency: string | null;
  shop: string | null;
  model: string | null;
  overallScore: number;
  verdict: Verdict;
  createdAt: string;
}

export interface SavedAnalysis extends SavedAnalysisSummary {
  analysis: AnalysisResult;
}

export interface SaveAnalysisInput {
  productId?: string | null;
  productTitle: string;
  productImage?: string | null;
  productPrice?: string | null;
  productCurrency?: string | null;
  shop?: string | null;
  model?: string | null;
  analysis: AnalysisResult;
}

const SUMMARY_COLUMNS = `
  id, product_id, product_title, product_image, product_price,
  product_currency, shop, model, overall_score, verdict, created_at
`;

interface AnalysisRow {
  id: string;
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_price: string | null;
  product_currency: string | null;
  shop: string | null;
  model: string | null;
  overall_score: number | null;
  verdict: string | null;
  created_at: string;
  analysis_data?: string | null;
}

function toSummary(row: AnalysisRow): SavedAnalysisSummary {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title ?? 'Produit sans titre',
    productImage: row.product_image,
    productPrice: row.product_price,
    productCurrency: row.product_currency,
    shop: row.shop,
    model: row.model,
    overallScore: Number(row.overall_score ?? 0),
    verdict: (row.verdict as Verdict) ?? 'TEST',
    createdAt: row.created_at,
  };
}

/**
 * Store one analysis and return its id.
 *
 * The full result is kept as JSON in analysis_data; score and verdict are also
 * written to their own columns so list views can sort and filter without
 * parsing every row.
 */
export async function saveAnalysis(input: SaveAnalysisInput): Promise<string> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const id = randomUUID();
  // Explicit ISO 8601 rather than CURRENT_TIMESTAMP: it sorts lexicographically,
  // carries its timezone, and is what the browser can format directly.
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO analyses (
            id, product_id, product_title, product_image, product_price,
            product_currency, shop, model, overall_score, verdict,
            analysis_data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.productId ?? null,
      input.productTitle,
      input.productImage ?? null,
      input.productPrice ?? null,
      input.productCurrency ?? null,
      input.shop ?? null,
      input.model ?? null,
      input.analysis.overall_score,
      input.analysis.verdict,
      JSON.stringify(input.analysis),
      createdAt,
    ],
  });

  return id;
}

/** Every saved analysis, newest first. */
export async function listAnalyses(limit = 100, offset = 0): Promise<SavedAnalysisSummary[]> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}
          FROM analyses
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });

  return (result.rows as unknown as AnalysisRow[]).map(toSummary);
}

/**
 * The most recent analysis per product, keyed by Shopify product id.
 *
 * Used by the product grid to mark which products are already analysed without
 * loading every historical run.
 */
export async function latestAnalysisByProduct(): Promise<Record<string, SavedAnalysisSummary>> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const result = await db.execute(
    `SELECT ${SUMMARY_COLUMNS}
     FROM (
       SELECT *, ROW_NUMBER() OVER (
         PARTITION BY product_id ORDER BY created_at DESC, rowid DESC
       ) AS rn
       FROM analyses
       WHERE product_id IS NOT NULL
     )
     WHERE rn = 1`
  );

  const map: Record<string, SavedAnalysisSummary> = {};
  for (const row of result.rows as unknown as AnalysisRow[]) {
    if (!row.product_id) continue;
    map[row.product_id] = toSummary(row);
  }
  return map;
}

/** One saved analysis with its full result, or null when the id is unknown. */
export async function getAnalysis(id: string): Promise<SavedAnalysis | null> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}, analysis_data FROM analyses WHERE id = ?`,
    args: [id],
  });

  const row = (result.rows as unknown as AnalysisRow[])[0];
  if (!row) return null;

  return hydrate(row);
}

/** The latest saved analysis for a product, or null when it has never been run. */
export async function getLatestAnalysisForProduct(
  productId: string
): Promise<SavedAnalysis | null> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const result = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS}, analysis_data
          FROM analyses
          WHERE product_id = ?
          ORDER BY created_at DESC
          LIMIT 1`,
    args: [productId],
  });

  const row = (result.rows as unknown as AnalysisRow[])[0];
  if (!row) return null;

  return hydrate(row);
}

/**
 * Turn a stored row back into a full analysis.
 *
 * The stored JSON goes back through parseAnalysisResult so a row written by an
 * older version of the schema is validated and filled in the same way a fresh
 * model response is, instead of reaching the UI half-shaped.
 */
function hydrate(row: AnalysisRow): SavedAnalysis | null {
  if (!row.analysis_data) return null;

  try {
    return {
      ...toSummary(row),
      analysis: parseAnalysisResult(row.analysis_data),
    };
  } catch (error) {
    console.error(`Stored analysis ${row.id} could not be parsed:`, error);
    return null;
  }
}

/** Remove one analysis. Returns false when nothing matched the id. */
export async function deleteAnalysis(id: string): Promise<boolean> {
  await ensureDatabaseReady();
  const db = getDbConnection();

  const result = await db.execute({
    sql: 'DELETE FROM analyses WHERE id = ?',
    args: [id],
  });

  return result.rowsAffected > 0;
}
