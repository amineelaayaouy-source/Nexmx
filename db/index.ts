import { createClient, Client } from '@libsql/client';
import path from 'path';

/**
 * Database connection.
 *
 * Turso (libSQL over HTTP) whenever TURSO_DATABASE_URL is set. That is required
 * in any deployed environment: the Vercel filesystem is read-only, so the local
 * data/engine.db file can be read from the bundle but never written to, and
 * every INSERT silently fails. Falls back to the local file for development.
 */

let client: Client | null = null;

/** True when the app is talking to a remote (writable in production) database. */
export function isRemoteDatabase(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim());
}

export function getDbConnection(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL?.trim();

  if (url) {
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    client = createClient({ url, authToken: authToken || undefined });
  } else {
    // @libsql/client uses a URL string scheme for local files
    const DB_PATH = path.resolve(process.cwd(), 'data/engine.db');
    client = createClient({ url: `file:${DB_PATH}` });
  }

  return client;
}

/**
 * Schema statements, run one at a time.
 *
 * executeMultiple is not available on every libSQL transport, so the schema is
 * kept as a list of individual statements that work identically against a local
 * file and a remote Turso database.
 */
const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    source TEXT,
    url TEXT,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS product_inputs (
    id TEXT PRIMARY KEY,
    url TEXT,
    source TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Saved product analyses. The denormalised product_* columns let the list
  // views render without a Shopify round-trip, and keep a readable record even
  // after a product is deleted from the store.
  `CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_title TEXT,
    product_image TEXT,
    product_price TEXT,
    product_currency TEXT,
    shop TEXT,
    model TEXT,
    overall_score INTEGER,
    verdict TEXT,
    analysis_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS idx_analyses_product_id ON analyses (product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS angles (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    angle_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS creative_briefs (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    brief_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS generated_assets (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    asset_type TEXT,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS product_pages (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    page_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS ad_copies (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    copy_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS pipeline_runs (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    status TEXT,
    current_stage TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

/**
 * Columns added to `analyses` after the first release.
 *
 * CREATE TABLE IF NOT EXISTS leaves an existing table untouched, so a database
 * created before these columns existed needs them added explicitly. Checked
 * against PRAGMA table_info rather than assumed, so this is safe to re-run.
 */
const ANALYSES_ADDED_COLUMNS: Array<[string, string]> = [
  ['product_title', 'TEXT'],
  ['product_image', 'TEXT'],
  ['product_price', 'TEXT'],
  ['product_currency', 'TEXT'],
  ['shop', 'TEXT'],
  ['model', 'TEXT'],
  ['overall_score', 'INTEGER'],
  ['verdict', 'TEXT'],
];

async function migrateAnalysesTable(db: Client): Promise<void> {
  const info = await db.execute('PRAGMA table_info(analyses)');
  const existing = new Set(
    info.rows.map((row) => String((row as unknown as { name: string }).name))
  );

  for (const [column, type] of ANALYSES_ADDED_COLUMNS) {
    if (existing.has(column)) continue;
    // Column names here are literals from the list above, never user input.
    await db.execute(`ALTER TABLE analyses ADD COLUMN ${column} ${type}`);
  }
}

export async function initializeDatabase(): Promise<void> {
  const db = getDbConnection();

  try {
    for (const statement of SCHEMA_STATEMENTS) {
      await db.execute(statement);
    }
    await migrateAnalysesTable(db);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Run the schema once per server instance.
 *
 * There is no migration step in a serverless deploy, so every route that writes
 * calls this first. The promise is cached so concurrent requests share one run,
 * and cleared on failure so the next request retries instead of being stuck
 * with a rejected promise forever.
 */
let readyPromise: Promise<void> | null = null;

export function ensureDatabaseReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = initializeDatabase().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}
