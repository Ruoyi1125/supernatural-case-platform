import { create } from 'zustand';

interface UserStore {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
