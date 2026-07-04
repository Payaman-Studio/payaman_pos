import { createContext, useContext, type Dispatch, type SetStateAction, type PropsWithChildren } from 'react';
import { useCashier, type CartItem } from '../hooks/useCashier';

interface CashierContextValue {
  cartItems: CartItem[];
  cashReceived: string;
  totalSales: number;
  totalPurchases: number;
  finalAmount: number;
  changeAmount: number;
  setCashReceived: Dispatch<SetStateAction<string>>;
  addToCart: (item: any, quantity: number, flowDirection: 'OUT' | 'IN') => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  checkout: () => Promise<any>;
  isSubmitting: boolean;
}

const CashierContext = createContext<CashierContextValue | null>(null);

export function CashierProvider({ children }: PropsWithChildren) {
  const cashier = useCashier();

  return (
    <CashierContext.Provider value={cashier}>
      {children}
    </CashierContext.Provider>
  );
}

export function useCashierContext(): CashierContextValue {
  const ctx = useContext(CashierContext);
  if (!ctx) {
    throw new Error('useCashierContext must be used within a CashierProvider');
  }
  return ctx;
}
