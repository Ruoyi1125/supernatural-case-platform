import { create } from 'zustand';

interface CaseStore {
  cases: any[];
  loading: boolean;
  setCases: (cases: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCaseStore = create<CaseStore>((set) => ({
  cases: [],
  loading: false,
  setCases: (cases) => set({ cases }),
  setLoading: (loading) => set({ loading }),
}));
