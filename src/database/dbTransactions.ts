import { getDatabase, generateId } from './index';
import { Transaction, PaginatedResult } from './types';

export type TransactionFilter = {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  perPage?: number;
};

function buildWhereClause(filter?: TransactionFilter): {
  clause: string;
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (!filter) return { clause: '', values };

  if (filter.dateFrom) {
    conditions.push('created_at >= ?');
    values.push(filter.dateFrom);
  }

  if (filter.dateTo) {
    conditions.push('created_at <= ?');
    values.push(filter.dateTo);
  }

  if (filter.minAmount !== undefined) {
    conditions.push('net_amount >= ?');
    values.push(filter.minAmount);
  }

  if (filter.maxAmount !== undefined) {
    conditions.push('net_amount <= ?');
    values.push(filter.maxAmount);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function getAll(
  filter?: TransactionFilter,
): Promise<PaginatedResult<Transaction>> {
  const db = await getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const [countResult] = await db.executeSql(
    `SELECT COUNT(*) as total FROM transactions ${clause}`,
    values,
  );
  const total = countResult.rows.item(0).total;

  let sql = `SELECT * FROM transactions ${clause} ORDER BY created_at DESC`;
  const queryValues: unknown[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const [results] = await db.executeSql(sql, queryValues);
  const data: Transaction[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    data.push(results.rows.item(i));
  }
  return { data, total };
}

export async function getById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  if (results.rows.length === 0) return null;
  return results.rows.item(0);
}

export async function store(
  data: Omit<Transaction, 'id' | 'created_at'>,
): Promise<Transaction> {
  const db = await getDatabase();
  const id = generateId();
  await db.executeSql(
    `INSERT INTO transactions (id, total_sales, total_purchases, net_amount, total_paid)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.total_sales, data.total_purchases, data.net_amount, data.total_paid],
  );
  const [result] = await db.executeSql(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  return result.rows.item(0);
}

export async function remove(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM transactions WHERE id = ?', [id]);
}
