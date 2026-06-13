import { getDatabase, generateId } from './index';
import { Commodity, PaginatedResult } from './types';

export type CommodityFilter = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  perPage?: number;
};

function buildWhereClause(filter?: CommodityFilter): {
  clause: string;
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

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

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function getAll(
  filter?: CommodityFilter,
): Promise<PaginatedResult<Commodity>> {
  const db = await getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const [countResult] = await db.executeSql(
    `SELECT COUNT(*) as total FROM commodities ${clause}`,
    values,
  );
  const total = countResult.rows.item(0).total;

  let sql = `SELECT * FROM commodities ${clause} ORDER BY name ASC`;
  const queryValues: unknown[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const [results] = await db.executeSql(sql, queryValues);
  const data: Commodity[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    data.push(results.rows.item(i));
  }
  return { data, total };
}

export async function getById(id: string): Promise<Commodity | null> {
  const db = await getDatabase();
  const [results] = await db.executeSql('SELECT * FROM commodities WHERE id = ?', [id]);
  if (results.rows.length === 0) return null;
  return results.rows.item(0);
}

export async function store(data: Omit<Commodity, 'id'>): Promise<Commodity> {
  const db = await getDatabase();
  const id = generateId();
  await db.executeSql(
    'INSERT INTO commodities (id, name, default_price, stock) VALUES (?, ?, ?, ?)',
    [id, data.name, data.default_price, data.stock],
  );
  return { id, ...data };
}

export async function update(
  id: string,
  data: Partial<Omit<Commodity, 'id'>>,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

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

  if (fields.length === 0) return;

  values.push(id);
  await db.executeSql(
    `UPDATE commodities SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function remove(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM commodities WHERE id = ?', [id]);
}
