import { getDatabase, generateId } from './index';
import type { TransactionDetail, PaginatedResult } from './types';
import type { SQLiteValue } from 'react-native-nitro-sqlite';

export type TransactionDetailFilter = {
  itemType?: 'PRODUCT' | 'COMMODITY';
  flowDirection?: 'OUT' | 'IN';
  transactionId?: string;
  itemId?: string;
  page?: number;
  perPage?: number;
};

function buildWhereClause(filter?: TransactionDetailFilter): {
  clause: string;
  values: SQLiteValue[];
} {
  const conditions: string[] = [];
  const values: SQLiteValue[] = [];

  if (!filter) return { clause: '', values };

  if (filter.itemType) {
    conditions.push('item_type = ?');
    values.push(filter.itemType);
  }

  if (filter.flowDirection) {
    conditions.push('flow_direction = ?');
    values.push(filter.flowDirection);
  }

  if (filter.transactionId) {
    conditions.push('transaction_id = ?');
    values.push(filter.transactionId);
  }

  if (filter.itemId) {
    conditions.push('item_id = ?');
    values.push(filter.itemId);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function getAll(
  filter?: TransactionDetailFilter,
): Promise<PaginatedResult<TransactionDetail>> {
  const db = getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const { results: countResults } = db.execute(
    `SELECT COUNT(*) as total FROM transaction_details ${clause}`,
    values,
  );
  const total = Number(countResults[0].total);

  let sql = `SELECT * FROM transaction_details ${clause} ORDER BY id ASC`;
  const queryValues: SQLiteValue[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const { results } = db.execute(sql, queryValues);
  return { data: results as unknown as TransactionDetail[], total };
}

export async function getById(id: string): Promise<TransactionDetail | null> {
  const db = getDatabase();
  const { results } = db.execute(
    'SELECT * FROM transaction_details WHERE id = ?',
    [id],
  );
  if (results.length === 0) return null;
  return results[0] as unknown as TransactionDetail;
}

export async function getByTransactionId(
  transactionId: string,
): Promise<PaginatedResult<TransactionDetail>> {
  return getAll({ transactionId });
}

export async function getByTransactionIds(
  transactionIds: string[],
): Promise<TransactionDetail[]> {
  if (transactionIds.length === 0) return [];

  const db = getDatabase();
  const placeholders = transactionIds.map(() => '?').join(',');
  const { results } = db.execute(
    `SELECT * FROM transaction_details WHERE transaction_id IN (${placeholders}) ORDER BY id ASC`,
    transactionIds,
  );
  return results as unknown as TransactionDetail[];
}

export async function store(
  data: Omit<TransactionDetail, 'id'>,
): Promise<TransactionDetail> {
  const db = getDatabase();
  const id = generateId();
  db.execute(
    `INSERT INTO transaction_details (id, transaction_id, item_type, item_id, quantity, price_at_sale, flow_direction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.transaction_id,
      data.item_type,
      data.item_id,
      data.quantity,
      data.price_at_sale,
      data.flow_direction,
    ],
  );
  return { id, ...data };
}

export async function remove(id: string): Promise<void> {
  const db = getDatabase();
  db.execute('DELETE FROM transaction_details WHERE id = ?', [id]);
}

export async function removeByTransactionId(transactionId: string): Promise<void> {
  const db = getDatabase();
  db.execute(
    'DELETE FROM transaction_details WHERE transaction_id = ?',
    [transactionId],
  );
}
