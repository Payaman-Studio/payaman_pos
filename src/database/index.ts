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

function seedDatabase(dbConn: NitroSQLiteConnection) {
  try {
    const { results: productsResult } = dbConn.execute('SELECT COUNT(*) as total FROM products');
    const { results: commoditiesResult } = dbConn.execute('SELECT COUNT(*) as total FROM commodities');
    const productsCount = Number(productsResult[0]?.total) || 0;
    const commoditiesCount = Number(commoditiesResult[0]?.total) || 0;

    if (productsCount === 0 && commoditiesCount === 0) {
      const dummyProducts = [
        {
          id: uuidv4(),
          barcode: 'MG-001',
          name: 'Minyak Goreng 2L',
          cost_price: 30000,
          selling_price: 35000,
          stock: 2,
          category: 'Sembako',
          min_stock: 5,
        },
        {
          id: uuidv4(),
          barcode: 'BP-025',
          name: 'Beras Premium 5kg',
          cost_price: 70000,
          selling_price: 78000,
          stock: 15,
          category: 'Sembako',
          min_stock: 5,
        },
        {
          id: uuidv4(),
          barcode: 'GP-003',
          name: 'Gula Pasir 1kg',
          cost_price: 14000,
          selling_price: 16000,
          stock: 1,
          category: 'Sembako',
          min_stock: 5,
        },
        {
          id: uuidv4(),
          barcode: 'KR-099',
          name: 'Krupuk Udang 250g',
          cost_price: 10000,
          selling_price: 12500,
          stock: 42,
          category: 'Camilan',
          min_stock: 5,
        },
      ];

      for (const p of dummyProducts) {
        dbConn.execute(
          'INSERT INTO products (id, barcode, name, cost_price, selling_price, stock, category, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.barcode, p.name, p.cost_price, p.selling_price, p.stock, p.category, p.min_stock],
        );
      }

      const dummyCommodities = [
        {
          id: uuidv4(),
          barcode: 'TL-012',
          name: 'Telur Ayam (Kg)',
          default_price: 28000,
          stock: 1.5,
          category: 'Sembako',
          min_stock: 2,
        },
        {
          id: uuidv4(),
          barcode: null,
          name: 'Sayur Bayam Warga',
          default_price: 3500,
          stock: 10.0,
          category: 'Sayuran',
          min_stock: 5,
        },
      ];

      for (const c of dummyCommodities) {
        dbConn.execute(
          'INSERT INTO commodities (id, barcode, name, default_price, stock, category, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.barcode, c.name, c.default_price, c.stock, c.category, c.min_stock],
        );
      }
    }
  } catch {
    // Gagal melakukan seeding, biarkan kosong
  }
}

export function getDatabase(): NitroSQLiteConnection {
  if (db) return db;

  db = open({ name: 'waroeng.db' });
  db.execute(CREATE_TABLES);
  migrate(db);
  seedDatabase(db);

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
