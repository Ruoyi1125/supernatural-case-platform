import { create } from 'zustand';

interface OrderStore {
  orders: any[];
  loading: boolean;
  setOrders: (orders: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  loading: false,
  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),
}));
