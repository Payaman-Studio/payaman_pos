import { getDatabase, generateId } from './index';
import type { Commodity, PaginatedResult } from './types';
import type { SQLiteValue } from 'react-native-nitro-sqlite';

export type CommodityFilter = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  page?: number;
  perPage?: number;
};

function buildWhereClause(filter?: CommodityFilter): {
  clause: string;
  values: SQLiteValue[];
} {
  const conditions: string[] = [];
  const values: SQLiteValue[] = [];

  if (!filter) return { clause: '', values };

  if (filter.search) {
    conditions.push('name LIKE ?');
    values.push(`%${filter.search}%`);
  }

  if (filter.minPrice !== undefined) {
    conditions.push('default_price >= ?');
    values.push(filter.minPrice);
  }

  if (filter.maxPrice !== undefined) {
    conditions.push('default_price <= ?');
    values.push(filter.maxPrice);
  }

  if (filter.category) {
    conditions.push('category = ?');
    values.push(filter.category);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function getAll(
  filter?: CommodityFilter,
): Promise<PaginatedResult<Commodity>> {
  const db = getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const { results: countResults } = db.execute(
    `SELECT COUNT(*) as total FROM commodities ${clause}`,
    values,
  );
  const total = Number(countResults[0].total);

  let sql = `SELECT * FROM commodities ${clause} ORDER BY name ASC`;
  const queryValues: SQLiteValue[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const { results } = db.execute(sql, queryValues);
  return { data: results as unknown as Commodity[], total };
}

export async function getById(id: string): Promise<Commodity | null> {
  const db = getDatabase();
  const { results } = db.execute('SELECT * FROM commodities WHERE id = ?', [id]);
  if (results.length === 0) return null;
  return results[0] as unknown as Commodity;
}

export async function store(data: Omit<Commodity, 'id'>): Promise<Commodity> {
  const db = getDatabase();
  const id = generateId();
  db.execute(
    'INSERT INTO commodities (id, barcode, name, default_price, stock, category) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.barcode, data.name, data.default_price, data.stock, data.category],
  );
  return { id, ...data };
}

export async function update(
  id: string,
  data: Partial<Omit<Commodity, 'id'>>,
): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SQLiteValue[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.default_price !== undefined) {
    fields.push('default_price = ?');
    values.push(data.default_price);
  }
  if (data.stock !== undefined) {
    fields.push('stock = ?');
    values.push(data.stock);
  }
  if (data.barcode !== undefined) {
    fields.push('barcode = ?');
    values.push(data.barcode);
  }
  if (data.category !== undefined) {
    fields.push('category = ?');
    values.push(data.category);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.execute(`UPDATE commodities SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function remove(id: string): Promise<void> {
  const db = getDatabase();
  db.execute('DELETE FROM commodities WHERE id = ?', [id]);
}
