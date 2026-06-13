import { getDatabase, generateId } from './index';
import { TransactionDetail, PaginatedResult } from './types';

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
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

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
  const db = await getDatabase();
  const { clause, values } = buildWhereClause(filter);

  const [countResult] = await db.executeSql(
    `SELECT COUNT(*) as total FROM transaction_details ${clause}`,
    values,
  );
  const total = countResult.rows.item(0).total;

  let sql = `SELECT * FROM transaction_details ${clause} ORDER BY id ASC`;
  const queryValues: unknown[] = [...values];

  if (filter?.page && filter?.perPage) {
    const offset = (filter.page - 1) * filter.perPage;
    sql += ' LIMIT ? OFFSET ?';
    queryValues.push(filter.perPage, offset);
  }

  const [results] = await db.executeSql(sql, queryValues);
  const data: TransactionDetail[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    data.push(results.rows.item(i));
  }
  return { data, total };
}

export async function getById(id: string): Promise<TransactionDetail | null> {
  const db = await getDatabase();
  const [results] = await db.executeSql(
    'SELECT * FROM transaction_details WHERE id = ?',
    [id],
  );
  if (results.rows.length === 0) return null;
  return results.rows.item(0);
}

export async function getByTransactionId(
  transactionId: string,
): Promise<PaginatedResult<TransactionDetail>> {
  return getAll({ transactionId });
}

export async function store(
  data: Omit<TransactionDetail, 'id'>,
): Promise<TransactionDetail> {
  const db = await getDatabase();
  const id = generateId();
  await db.executeSql(
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
  const db = await getDatabase();
  await db.executeSql('DELETE FROM transaction_details WHERE id = ?', [id]);
}

export async function removeByTransactionId(transactionId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'DELETE FROM transaction_details WHERE transaction_id = ?',
    [transactionId],
  );
}
