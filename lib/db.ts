import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Initialize tables if they don't exist
export async function initDB() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      value_date TEXT,
      description TEXT NOT NULL,
      debit REAL,
      credit REAL,
      balance REAL,
      bank TEXT NOT NULL,
      owner TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      import_batch TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classification_rules (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL DEFAULT '',
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
