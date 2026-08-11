import { createClient, Client } from '@libsql/client';
import path from 'path';

// For local persistence
const DB_PATH = path.resolve(process.cwd(), 'data/engine.db');

export function getDbConnection(): Client {
  // @libsql/client uses a URL string scheme for local files
  const dbUrl = `file:${DB_PATH}`;
  
  return createClient({
    url: dbUrl,
  });
}

export async function initializeDatabase() {
  const db = getDbConnection();
  
  const initQueries = `
    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      source TEXT,
      url TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product inputs
    CREATE TABLE IF NOT EXISTS product_inputs (
      id TEXT PRIMARY KEY,
      url TEXT,
      source TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Analyses
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      analysis_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Angles
    CREATE TABLE IF NOT EXISTS angles (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      angle_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Creative briefs
    CREATE TABLE IF NOT EXISTS creative_briefs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      brief_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Generated assets
    CREATE TABLE IF NOT EXISTS generated_assets (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      asset_type TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product pages
    CREATE TABLE IF NOT EXISTS product_pages (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      page_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ad copies
    CREATE TABLE IF NOT EXISTS ad_copies (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      copy_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Pipeline runs
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      status TEXT,
      current_stage TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.executeMultiple(initQueries);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
