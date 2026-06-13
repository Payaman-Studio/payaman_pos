import { open } from 'react-native-nitro-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { CREATE_TABLES } from './schema';
import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

let db: NitroSQLiteConnection | null = null;

function seedDatabase(dbConn: NitroSQLiteConnection) {
  try {
    const { results: productsCount } = dbConn.execute('SELECT COUNT(*) as total FROM products');
    const { results: commoditiesCount } = dbConn.execute('SELECT COUNT(*) as total FROM commodities');

    const totalProducts = Number(productsCount[0].total);
    const totalCommodities = Number(commoditiesCount[0].total);

    if (totalProducts === 0 && totalCommodities === 0) {
      const dummyProducts = [
        {
          id: uuidv4(),
          barcode: 'MG-001',
          name: 'Minyak Goreng 2L',
          cost_price: 30000,
          selling_price: 35000,
          stock: 2,
          category: 'Sembako',
        },
        {
          id: uuidv4(),
          barcode: 'BP-025',
          name: 'Beras Premium 5kg',
          cost_price: 70000,
          selling_price: 78000,
          stock: 15,
          category: 'Sembako',
        },
        {
          id: uuidv4(),
          barcode: 'GP-003',
          name: 'Gula Pasir 1kg',
          cost_price: 14000,
          selling_price: 16000,
          stock: 1,
          category: 'Sembako',
        },
        {
          id: uuidv4(),
          barcode: 'KR-099',
          name: 'Krupuk Udang 250g',
          cost_price: 10000,
          selling_price: 12500,
          stock: 42,
          category: 'Camilan',
        },
      ];

      for (const p of dummyProducts) {
        dbConn.execute(
          'INSERT INTO products (id, barcode, name, cost_price, selling_price, stock, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.barcode, p.name, p.cost_price, p.selling_price, p.stock, p.category],
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
        },
        {
          id: uuidv4(),
          barcode: null,
          name: 'Sayur Bayam Warga',
          default_price: 3500,
          stock: 10.0,
          category: 'Sayuran',
        },
      ];

      for (const c of dummyCommodities) {
        dbConn.execute(
          'INSERT INTO commodities (id, barcode, name, default_price, stock, category) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.barcode, c.name, c.default_price, c.stock, c.category],
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

  try {
    db.execute('ALTER TABLE products ADD COLUMN category VARCHAR(100)');
  } catch {
    // Abaikan jika kolom sudah ada
  }
  try {
    db.execute('ALTER TABLE commodities ADD COLUMN barcode VARCHAR(50)');
  } catch {
    // Abaikan jika kolom sudah ada
  }
  try {
    db.execute('ALTER TABLE commodities ADD COLUMN category VARCHAR(100)');
  } catch {
    // Abaikan jika kolom sudah ada
  }

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
