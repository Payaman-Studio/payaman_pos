import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as dbProducts from '../database/dbProducts';
import * as dbCommodities from '../database/dbCommodities';
import { Product, Commodity } from '../database/types';

export interface InventoryItem {
  id: string;
  type: 'PRODUCT' | 'COMMODITY';
  barcode: string | null;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  category: string | null;
  unit: string;
  isLowStock: boolean;
}

export interface UseInventoryFilters {
  search: string;
  category: string;
  lowStockOnly: boolean;
}

const LOW_STOCK_THRESHOLD = 2.0;

function getUnit(name: string, type: 'PRODUCT' | 'COMMODITY'): string {
  if (type === 'PRODUCT') {
    return 'Pcs';
  }
  const lowerName = name.toLowerCase();
  if (lowerName.includes('(kg)') || lowerName.includes(' kg')) {
    return 'Kg';
  }
  if (lowerName.includes('ikat')) {
    return 'Ikat';
  }
  return 'Pcs';
}

export function useInventory(filters: UseInventoryFilters) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await dbProducts.getAll();
      return res.data;
    },
  });

  const commoditiesQuery = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await dbCommodities.getAll();
      return res.data;
    },
  });

  const isLoading = productsQuery.isLoading || commoditiesQuery.isLoading;
  const error = productsQuery.error || commoditiesQuery.error;

  const products = productsQuery.data || [];
  const commodities = commoditiesQuery.data || [];

  // Konversi produk ke item inventori terpadu
  const mappedProducts: InventoryItem[] = products.map((p: Product) => ({
    id: p.id,
    type: 'PRODUCT',
    barcode: p.barcode,
    name: p.name,
    price: p.selling_price,
    costPrice: p.cost_price,
    stock: p.stock,
    category: p.category,
    unit: getUnit(p.name, 'PRODUCT'),
    isLowStock: p.stock <= LOW_STOCK_THRESHOLD,
  }));

  // Konversi komoditas ke item inventori terpadu
  const mappedCommodities: InventoryItem[] = commodities.map((c: Commodity) => ({
    id: c.id,
    type: 'COMMODITY',
    barcode: c.barcode,
    name: c.name,
    price: c.default_price,
    stock: c.stock,
    category: c.category,
    unit: getUnit(c.name, 'COMMODITY'),
    isLowStock: c.stock <= LOW_STOCK_THRESHOLD,
  }));

  // Gabungkan semua item
  const allItems = [...mappedProducts, ...mappedCommodities];

  // Hitung jumlah item dengan stok rendah
  const lowStockCount = allItems.filter(item => item.isLowStock).length;

  // Lakukan filter di memori demi performa pencarian instan & responsif
  const filteredItems = allItems.filter(item => {
    // Filter pencarian
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(searchLower);
      const matchBarcode = item.barcode ? item.barcode.toLowerCase().includes(searchLower) : false;
      if (!matchName && !matchBarcode) return false;
    }

    // Filter kategori
    if (filters.category && filters.category !== 'Semua') {
      if (item.category !== filters.category) return false;
    }

    // Filter stok rendah
    if (filters.lowStockOnly) {
      if (!item.isLowStock) return false;
    }

    return true;
  });

  // Urutkan item: stok rendah terlebih dahulu, kemudian nama ASC
  const sortedItems = filteredItems.sort((a, b) => {
    if (a.isLowStock && !b.isLowStock) return -1;
    if (!a.isLowStock && b.isLowStock) return 1;
    return a.name.localeCompare(b.name);
  });

  // Ambil list semua kategori unik untuk filter pill
  const uniqueCategories = Array.from(
    new Set(
      allItems
        .map(item => item.category)
        .filter((cat): cat is string => cat !== null && cat !== undefined)
    )
  );
  const categories = ['Semua', ...uniqueCategories];

  // Tambah produk mutasi
  const addProductMutation = useMutation({
    mutationFn: async (data: Omit<Product, 'id'>) => {
      return await dbProducts.store(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Tambah komoditas mutasi
  const addCommodityMutation = useMutation({
    mutationFn: async (data: Omit<Commodity, 'id'>) => {
      return await dbCommodities.store(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodities'] });
    },
  });

  const refetch = () => {
    productsQuery.refetch();
    commoditiesQuery.refetch();
  };

  return {
    inventoryItems: sortedItems,
    lowStockCount,
    categories,
    isLoading,
    error,
    refetch,
    addProduct: addProductMutation.mutateAsync,
    addCommodity: addCommodityMutation.mutateAsync,
  };
}
