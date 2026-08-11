import sqlite3 from 'sqlite3';
import path from 'path';

// For local persistence
const DB_PATH = path.resolve(process.cwd(), 'data/engine.db');

export function getDbConnection() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    }
  });
  return db;
}

export function initializeDatabase() {
  const db = getDbConnection();
  
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      source TEXT,
      url TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Product inputs
    db.run(`CREATE TABLE IF NOT EXISTS product_inputs (
      id TEXT PRIMARY KEY,
      url TEXT,
      source TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Analyses
    db.run(`CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      analysis_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Angles
    db.run(`CREATE TABLE IF NOT EXISTS angles (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      angle_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Creative briefs
    db.run(`CREATE TABLE IF NOT EXISTS creative_briefs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      brief_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Generated assets
    db.run(`CREATE TABLE IF NOT EXISTS generated_assets (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      asset_type TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Product pages
    db.run(`CREATE TABLE IF NOT EXISTS product_pages (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      page_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ad copies
    db.run(`CREATE TABLE IF NOT EXISTS ad_copies (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      copy_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Pipeline runs
    db.run(`CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      status TEXT,
      current_stage TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME
    )`);

    // Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  db.close();
}
