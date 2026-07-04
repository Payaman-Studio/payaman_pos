import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '../database';
import * as dbTransactions from '../database/dbTransactions';
import * as dbTransactionDetails from '../database/dbTransactionDetails';
import type { Transaction, TransactionDetail } from '../database/types';

export type Period = 'today' | 'week' | 'month' | 'custom';

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

export function buildItemNameMap(details: TransactionDetail[]): Map<string, string> {
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

export function getTransactionType(details: TransactionDetail[]): 'TOKO' | 'CITIZEN' | 'MIXED' {
  const hasProduct = details.some((d) => d.item_type === 'PRODUCT');
  const hasCommodity = details.some((d) => d.item_type === 'COMMODITY');
  if (hasProduct && hasCommodity) return 'MIXED';
  if (hasCommodity) return 'CITIZEN';
  return 'TOKO';
}

function getPeriodRange(period: Period, customFrom?: string, customTo?: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const zeroPad = (n: number) => String(n).padStart(2, '0');

  let dateFrom: string;
  let dateTo: string;
  let prevFrom: string;
  let prevTo: string;

  switch (period) {
    case 'today': {
      dateFrom = `${y}-${m}-${d} 00:00:00`;
      dateTo = `${y}-${m}-${d} 23:59:59`;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yY = yesterday.getFullYear();
      const yM = zeroPad(yesterday.getMonth() + 1);
      const yD = zeroPad(yesterday.getDate());
      prevFrom = `${yY}-${yM}-${yD} 00:00:00`;
      prevTo = `${yY}-${yM}-${yD} 23:59:59`;
      break;
    }
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      dateFrom = `${weekAgo.getFullYear()}-${zeroPad(weekAgo.getMonth() + 1)}-${zeroPad(weekAgo.getDate())} 00:00:00`;
      dateTo = `${y}-${m}-${d} 23:59:59`;
      const prevWeekEnd = new Date(weekAgo);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
      const prevWeekStart = new Date(prevWeekEnd);
      prevWeekStart.setDate(prevWeekStart.getDate() - 6);
      prevFrom = `${prevWeekStart.getFullYear()}-${zeroPad(prevWeekStart.getMonth() + 1)}-${zeroPad(prevWeekStart.getDate())} 00:00:00`;
      prevTo = `${prevWeekEnd.getFullYear()}-${zeroPad(prevWeekEnd.getMonth() + 1)}-${zeroPad(prevWeekEnd.getDate())} 23:59:59`;
      break;
    }
    case 'month': {
      dateFrom = `${y}-${m}-01 00:00:00`;
      dateTo = `${y}-${m}-${d} 23:59:59`;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const pY = prevMonth.getFullYear();
      const pM = zeroPad(prevMonth.getMonth() + 1);
      const pD = zeroPad(prevMonth.getDate());
      prevFrom = `${pY}-${pM}-01 00:00:00`;
      prevTo = `${pY}-${pM}-${pD} 23:59:59`;
      break;
    }
    case 'custom': {
      dateFrom = customFrom ? `${customFrom} 00:00:00` : `${y}-${m}-${d} 00:00:00`;
      dateTo = customTo ? `${customTo} 23:59:59` : `${y}-${m}-${d} 23:59:59`;
      const fromDt = new Date(dateFrom);
      const toDt = new Date(dateTo);
      const diffMs = toDt.getTime() - fromDt.getTime();
      const prevFromDt = new Date(fromDt.getTime() - diffMs - 86400000);
      const prevToDt = new Date(fromDt.getTime() - 86400000);
      prevFrom = `${prevFromDt.getFullYear()}-${zeroPad(prevFromDt.getMonth() + 1)}-${zeroPad(prevFromDt.getDate())} 00:00:00`;
      prevTo = `${prevToDt.getFullYear()}-${zeroPad(prevToDt.getMonth() + 1)}-${zeroPad(prevToDt.getDate())} 23:59:59`;
      break;
    }
  }

  return { dateFrom, dateTo, prevFrom, prevTo };
}

export function useTransactionSummary(period?: Period, customFrom?: string, customTo?: string) {
  const query = useQuery({
    queryKey: ['transactions', 'summary', period || 'today', customFrom, customTo],
    queryFn: async () => {
      const range = getPeriodRange(period || 'today', customFrom, customTo);

      const { data: currentTx } = await dbTransactions.getAll({
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });

      const { data: prevTx } = await dbTransactions.getAll({
        dateFrom: range.prevFrom,
        dateTo: range.prevTo,
      });

      const dailyTotals = await dbTransactions.getDailyTotals(7);

      const currentNet = currentTx.reduce((s, t) => s + t.net_amount, 0);
      const previousNet = prevTx.reduce((s, t) => s + t.net_amount, 0);

      let changePercent: number | null = null;
      if (previousNet > 0) {
        changePercent = Math.round(((currentNet - previousNet) / previousNet) * 100);
      }

      return {
        totalTransactions: currentTx.length,
        totalSales: currentTx.reduce((s, t) => s + t.total_sales, 0),
        totalPurchases: currentTx.reduce((s, t) => s + t.total_purchases, 0),
        totalNet: currentNet,
        totalPaid: currentTx.reduce((s, t) => s + t.total_paid, 0),
        changePercent,
        previousTotal: previousNet,
        dailyTotals,
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return query;
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

export function useTransactionDetail(transactionId: string) {
  const query = useQuery({
    queryKey: ['transaction-detail', transactionId],
    queryFn: async () => {
      const tx = await dbTransactions.getById(transactionId);
      if (!tx) throw new Error('Transaksi tidak ditemukan');

      const { data: details } = await dbTransactionDetails.getByTransactionId(transactionId);
      const nameMap = buildItemNameMap(details);

      return {
        ...tx,
        items: details.map((d) => ({
          ...d,
          name: nameMap.get(d.item_id) || (d.item_type === 'PRODUCT' ? 'Produk' : 'Komoditas'),
          subtotal: d.quantity * d.price_at_sale,
        })),
        type: getTransactionType(details),
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return query;
}
