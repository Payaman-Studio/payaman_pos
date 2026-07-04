import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '../database';
import * as dbTransactions from '../database/dbTransactions';
import * as dbTransactionDetails from '../database/dbTransactionDetails';
import type { Transaction, TransactionDetail } from '../database/types';

export interface TransactionWithDetails extends Transaction {
  details: TransactionDetail[];
  itemCount: number;
  itemNames: string;
  type: 'TOKO' | 'CITIZEN' | 'MIXED';
}

interface ItemNameRecord {
  id: string;
  name: string;
}

function buildItemNameMap(details: TransactionDetail[]): Map<string, string> {
  const db = getDatabase();
  const map = new Map<string, string>();

  const productIds = [
    ...new Set(
      details.filter((d) => d.item_type === 'PRODUCT').map((d) => d.item_id),
    ),
  ];
  const commodityIds = [
    ...new Set(
      details.filter((d) => d.item_type === 'COMMODITY').map((d) => d.item_id),
    ),
  ];

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const { results } = db.execute(
      `SELECT id, name FROM products WHERE id IN (${placeholders})`,
      productIds,
    );
    for (const row of results as unknown as ItemNameRecord[]) {
      map.set(row.id, row.name);
    }
  }

  if (commodityIds.length > 0) {
    const placeholders = commodityIds.map(() => '?').join(',');
    const { results } = db.execute(
      `SELECT id, name FROM commodities WHERE id IN (${placeholders})`,
      commodityIds,
    );
    for (const row of results as unknown as ItemNameRecord[]) {
      map.set(row.id, row.name);
    }
  }

  return map;
}

function getTransactionType(details: TransactionDetail[]): 'TOKO' | 'CITIZEN' | 'MIXED' {
  const hasProduct = details.some((d) => d.item_type === 'PRODUCT');
  const hasCommodity = details.some((d) => d.item_type === 'COMMODITY');
  if (hasProduct && hasCommodity) return 'MIXED';
  if (hasCommodity) return 'CITIZEN';
  return 'TOKO';
}

export function useRecentTransactions(limit = 5) {
  const query = useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async (): Promise<TransactionWithDetails[]> => {
      const { data: transactions } = await dbTransactions.getAll({
        page: 1,
        perPage: limit,
      });

      const allTxIds = transactions.map((tx) => tx.id);
      const allDetails = await dbTransactionDetails.getByTransactionIds(allTxIds);
      const detailsByTxId = new Map<string, TransactionDetail[]>();
      for (const d of allDetails) {
        const list = detailsByTxId.get(d.transaction_id);
        if (list) {
          list.push(d);
        } else {
          detailsByTxId.set(d.transaction_id, [d]);
        }
      }

      const allDetailsFlat = Array.from(detailsByTxId.values()).flat();
      const nameMap = buildItemNameMap(allDetailsFlat);

      const enriched = transactions.map((tx) => {
        const details = detailsByTxId.get(tx.id) || [];
        const itemCount = details.length;
        const names = details
          .slice(0, 3)
          .map((d) => nameMap.get(d.item_id) || (d.item_type === 'PRODUCT' ? 'Produk' : 'Komoditas'));
        const itemNames = names.join(', ');
        return {
          ...tx,
          details,
          itemCount,
          itemNames,
          type: getTransactionType(details),
        };
      });

      return enriched;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return query;
}

export function useTransactionSummary() {
  const query = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;

      const { data: todayTransactions } = await dbTransactions.getAll({
        dateFrom: startOfDay,
      });

      const totalTransactions = todayTransactions.length;
      const totalSales = todayTransactions.reduce((s, t) => s + t.total_sales, 0);
      const totalPurchases = todayTransactions.reduce((s, t) => s + t.total_purchases, 0);
      const totalNet = todayTransactions.reduce((s, t) => s + t.net_amount, 0);

      return {
        totalTransactions,
        totalSales,
        totalPurchases,
        totalNet,
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return query;
}
