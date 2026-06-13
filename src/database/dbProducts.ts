import { getDatabase, generateId } from './index';
import type { Product, PaginatedResult } from './types';
import type { SQLiteValue } from 'react-native-nitro-sqlite';

export type ProductFilter = {
  search?: string;
  minStock?: number;
  maxStock?: number;
  lowStock?: boolean;
  page?: number;
  perPage?: number;
};

function buildWhereClause(filter?: ProductFilter): {
  clause: string;
  values: SQLiteValue[];
} {
  const conditions: string[] = [];
  const values: SQLiteValue[] = [];

  if (!filter) return { clause: '', values };

  if (filter.search) {
    conditions.push('(name LIKE ? OR barcode LIKE ?)');
    const pattern = `%${filter.search}%`;
    values.push(pattern, pattern);
  }

  if (filter.minStock !== undefined) {
    conditions.push('stock >= ?');
    values.push(filter.minStock);
  }

  if (filter.maxStock !== undefined) {
    conditions.push('stock <= ?');
    values.push(filter.maxStock);
  }

  if (filter.lowStock) {
    conditions.push('stock = 0');
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function getAll(
  filter?: ProductFilter,
): Promise<PaginatedResult<Product>> {
  const db = getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const { results: countResults } = db.execute(
    `SELECT COUNT(*) as total FROM products ${clause}`,
    values,
  );
  const total = Number(countResults[0].total);

  let sql = `SELECT * FROM products ${clause} ORDER BY name ASC`;
  const queryValues: SQLiteValue[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const { results } = db.execute(sql, queryValues);
  return { data: results as unknown as Product[], total };
}

export async function getById(id: string): Promise<Product | null> {
  const db = getDatabase();
  const { results } = db.execute('SELECT * FROM products WHERE id = ?', [id]);
  if (results.length === 0) return null;
  return results[0] as unknown as Product;
}

export async function store(data: Omit<Product, 'id'>): Promise<Product> {
  const db = getDatabase();
  const id = generateId();
  db.execute(
    'INSERT INTO products (id, barcode, name, cost_price, selling_price, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.barcode, data.name, data.cost_price, data.selling_price, data.stock],
  );
  return { id, ...data };
}

export async function update(
  id: string,
  data: Partial<Omit<Product, 'id'>>,
): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SQLiteValue[] = [];

  if (data.barcode !== undefined) {
    fields.push('barcode = ?');
    values.push(data.barcode);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.cost_price !== undefined) {
    fields.push('cost_price = ?');
    values.push(data.cost_price);
  }
  if (data.selling_price !== undefined) {
    fields.push('selling_price = ?');
    values.push(data.selling_price);
  }
  if (data.stock !== undefined) {
    fields.push('stock = ?');
    values.push(data.stock);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function remove(id: string): Promise<void> {
  const db = getDatabase();
  db.execute('DELETE FROM products WHERE id = ?', [id]);
}
