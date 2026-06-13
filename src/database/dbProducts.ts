import { getDatabase, generateId } from './index';
import { Product, PaginatedResult } from './types';

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
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

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
  const db = await getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const [countResult] = await db.executeSql(
    `SELECT COUNT(*) as total FROM products ${clause}`,
    values,
  );
  const total = countResult.rows.item(0).total;

  let sql = `SELECT * FROM products ${clause} ORDER BY name ASC`;
  const queryValues: unknown[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const [results] = await db.executeSql(sql, queryValues);
  const data: Product[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    data.push(results.rows.item(i));
  }
  return { data, total };
}

export async function getById(id: string): Promise<Product | null> {
  const db = await getDatabase();
  const [results] = await db.executeSql('SELECT * FROM products WHERE id = ?', [id]);
  if (results.rows.length === 0) return null;
  return results.rows.item(0);
}

export async function store(data: Omit<Product, 'id'>): Promise<Product> {
  const db = await getDatabase();
  const id = generateId();
  await db.executeSql(
    'INSERT INTO products (id, barcode, name, cost_price, selling_price, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.barcode, data.name, data.cost_price, data.selling_price, data.stock],
  );
  return { id, ...data };
}

export async function update(
  id: string,
  data: Partial<Omit<Product, 'id'>>,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

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
  await db.executeSql(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function remove(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM products WHERE id = ?', [id]);
}
