export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  cost_price: number;
  selling_price: number;
  stock: number;
}

export interface Commodity {
  id: string;
  name: string;
  default_price: number;
  stock: number;
}

export interface Transaction {
  id: string;
  total_sales: number;
  total_purchases: number;
  net_amount: number;
  total_paid: number;
  created_at: string;
}

export interface TransactionDetail {
  id: string;
  transaction_id: string;
  item_type: 'PRODUCT' | 'COMMODITY';
  item_id: string;
  quantity: number;
  price_at_sale: number;
  flow_direction: 'OUT' | 'IN';
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};
