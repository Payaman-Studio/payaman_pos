import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as dbProducts from '../database/dbProducts';
import * as dbCommodities from '../database/dbCommodities';
import * as dbTransactions from '../database/dbTransactions';
import * as dbTransactionDetails from '../database/dbTransactionDetails';
import { InventoryItem } from './useInventory';

export interface CartItem {
  id: string;
  itemId: string;
  type: 'PRODUCT' | 'COMMODITY';
  name: string;
  price: number;
  quantity: number;
  flowDirection: 'OUT' | 'IN';
  unit: string;
  photo: string | null;
}

export function useCashier() {
  const queryClient = useQueryClient();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cashReceived, setCashReceived] = useState('0');

  // Menambahkan barang ke keranjang
  const addToCart = (item: InventoryItem | { id: string; name: string; price: number; type: 'PRODUCT' | 'COMMODITY'; unit: string; barcode?: string | null; photo?: string | null }, quantity: number, flowDirection: 'OUT' | 'IN') => {
    setCartItems(prev => {
      // Cek apakah item serupa dengan tipe & arah aliran yang sama sudah ada di keranjang
      const existingIndex = prev.findIndex(
        x => x.itemId === item.id && x.flowDirection === flowDirection
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }

      const cartId = `${item.id}-${flowDirection}-${Date.now()}`;
      return [
        ...prev,
        {
          id: cartId,
          itemId: item.id,
          type: item.type,
          name: item.name,
          price: item.price,
          quantity,
          flowDirection,
          unit: item.unit,
          photo: item.photo ?? null,
        },
      ];
    });
  };

  // Mengubah kuantitas item di keranjang
  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  // Menghapus item dari keranjang
  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  // Mengosongkan keranjang
  const clearCart = () => {
    setCartItems([]);
    setCashReceived('0');
  };

  // Kalkulasi total
  const totalSales = cartItems
    .filter(item => item.flowDirection === 'OUT')
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalPurchases = cartItems
    .filter(item => item.flowDirection === 'IN')
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Nilai bersih transaksi (Penjualan - Pembelian)
  const netAmount = totalSales - totalPurchases;
  
  const finalAmount = netAmount;

  // Kalkulasi Kembalian (hanya jika finalAmount positif / pelanggan harus bayar)
  const cashNum = Number(cashReceived) || 0;
  const changeAmount = finalAmount > 0 ? Math.max(0, cashNum - finalAmount) : 0;

  // Checkout mutasi transaksi
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // 1. Simpan Transaksi Utama
      const tx = await dbTransactions.store({
        total_sales: totalSales,
        total_purchases: totalPurchases,
        net_amount: finalAmount,
        total_paid: cashNum,
      });

      // 2. Simpan Detail Transaksi dan Update Stok
      for (const item of cartItems) {
        // Simpan detail ke DB
        await dbTransactionDetails.store({
          transaction_id: tx.id,
          item_type: item.type,
          item_id: item.itemId,
          quantity: item.quantity,
          price_at_sale: item.price,
          flow_direction: item.flowDirection,
        });

        // Update Stok
        if (item.type === 'PRODUCT') {
          const product = await dbProducts.getById(item.itemId);
          if (product) {
            // Produk berkurang stoknya jika dijual (flowDirection === 'OUT')
            // Atau bertambah stoknya jika kita membeli/kulakan (flowDirection === 'IN')
            const qtyChange = item.flowDirection === 'OUT' ? -item.quantity : item.quantity;
            const newStock = Math.max(0, product.stock + qtyChange);
            await dbProducts.update(item.itemId, { stock: newStock });
          }
        } else {
          const commodity = await dbCommodities.getById(item.itemId);
          if (commodity) {
            // Komoditas bertambah stoknya jika kita membelinya dari warga (flowDirection === 'IN')
            // Atau berkurang stoknya jika kita menjualnya (flowDirection === 'OUT')
            const qtyChange = item.flowDirection === 'IN' ? item.quantity : -item.quantity;
            const newStock = Math.max(0, commodity.stock + qtyChange);
            await dbCommodities.update(item.itemId, { stock: newStock });
          }
        }
      }

      return tx;
    },
    onSuccess: () => {
      // Refresh queries data inventori terbaru
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['commodities'] });
      clearCart();
    },
  });

  return {
    cartItems,
    cashReceived,
    totalSales,
    totalPurchases,
    finalAmount,
    changeAmount,
    setCashReceived,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout: checkoutMutation.mutateAsync,
    isSubmitting: checkoutMutation.isPending,
  };
}
