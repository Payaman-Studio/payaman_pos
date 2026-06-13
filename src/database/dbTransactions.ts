import { getDatabase, generateId } from './index';
import type { Transaction, PaginatedResult } from './types';
import type { SQLiteValue } from 'react-native-nitro-sqlite';

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
  values: SQLiteValue[];
} {
  const conditions: string[] = [];
  const values: SQLiteValue[] = [];

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
  const db = getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const { results: countResults } = db.execute(
    `SELECT COUNT(*) as total FROM transactions ${clause}`,
    values,
  );
  const total = Number(countResults[0].total);

  let sql = `SELECT * FROM transactions ${clause} ORDER BY created_at DESC`;
  const queryValues: SQLiteValue[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const { results } = db.execute(sql, queryValues);
  return { data: results as unknown as Transaction[], total };
}

export async function getById(id: string): Promise<Transaction | null> {
  const db = getDatabase();
  const { results } = db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
  if (results.length === 0) return null;
  return results[0] as unknown as Transaction;
}

export async function store(
  data: Omit<Transaction, 'id' | 'created_at'>,
): Promise<Transaction> {
  const db = getDatabase();
  const id = generateId();
  db.execute(
    `INSERT INTO transactions (id, total_sales, total_purchases, net_amount, total_paid)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.total_sales, data.total_purchases, data.net_amount, data.total_paid],
  );
  const { results } = db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
  return results[0] as unknown as Transaction;
}

export async function remove(id: string): Promise<void> {
  const db = getDatabase();
  db.execute('DELETE FROM transactions WHERE id = ?', [id]);
}
