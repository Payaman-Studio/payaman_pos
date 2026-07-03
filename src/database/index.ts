import 'react-native-get-random-values';
import { open } from 'react-native-nitro-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { CREATE_TABLES } from './schema';
import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

const SCHEMA_VERSION = 2;

let db: NitroSQLiteConnection | null = null;

function migrate(dbConn: NitroSQLiteConnection) {
  const { results } = dbConn.execute('PRAGMA user_version');
  const version = Number(results[0]?.user_version) || 0;

  if (version >= SCHEMA_VERSION) return;

  const migrations: string[] = [];

  if (version < 1) {
    migrations.push(
      'ALTER TABLE products ADD COLUMN category VARCHAR(100)',
      'ALTER TABLE commodities ADD COLUMN barcode VARCHAR(50)',
      'ALTER TABLE commodities ADD COLUMN category VARCHAR(100)',
      'ALTER TABLE products ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 5',
      'ALTER TABLE commodities ADD COLUMN min_stock DECIMAL(10,2) NOT NULL DEFAULT 5.00',
    );
  }

  if (version < 2) {
    migrations.push(
      'ALTER TABLE products ADD COLUMN photo VARCHAR(500)',
    );
  }

  for (const sql of migrations) {
    try {
      dbConn.execute(sql);
    } catch {
      // Kolom mungkin sudah ada dari versi sebelumnya — skip
    }
  }

  dbConn.execute(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export function getDatabase(): NitroSQLiteConnection {
  if (db) return db;

  db = open({ name: 'waroeng.db' });
  for (const stmt of CREATE_TABLES) {
    db.execute(stmt);
  }
  migrate(db);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function generateId(): string {
  return uuidv4();
}

export function getDatabasePath(): string | null {
  const dbConn = getDatabase();
  try {
    const { results } = dbConn.execute('PRAGMA database_list');
    const file = (results[0] as Record<string, unknown>)?.file;
    return typeof file === 'string' && file.length > 0 ? file : null;
  } catch {
    return null;
  }
}
