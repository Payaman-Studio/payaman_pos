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

function getItemName(detail: TransactionDetail): string {
  const db = getDatabase();
  if (detail.item_type === 'PRODUCT') {
    const { results } = db.execute('SELECT name FROM products WHERE id = ?', [detail.item_id]);
    return (results[0]?.name as string) || 'Produk';
  }
  const { results } = db.execute('SELECT name FROM commodities WHERE id = ?', [detail.item_id]);
  return (results[0]?.name as string) || 'Komoditas';
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

      const enriched = await Promise.all(
        transactions.map(async (tx) => {
          const { data: details } = await dbTransactionDetails.getByTransactionId(tx.id);
          const itemCount = details.length;
          const names = details.slice(0, 3).map(getItemName);
          const itemNames = names.join(', ');
          return {
            ...tx,
            details,
            itemCount,
            itemNames,
            type: getTransactionType(details),
          };
        }),
      );

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
