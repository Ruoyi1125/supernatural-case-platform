import { create } from 'zustand'
import { Case, CaseSearchFilters } from '../shared/types'
import { caseStore } from './caseStore'

interface CaseState {
  cases: Case[]
  loading: boolean
  searchTerm: string
  filters: CaseSearchFilters
  
  // 方法
  setCases: (cases: Case[]) => void
  setLoading: (loading: boolean) => void
  setSearchTerm: (term: string) => void
  setFilters: (filters: CaseSearchFilters) => void
  searchCases: () => void
  loadAllCases: () => void
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  loading: false,
  searchTerm: '',
  filters: {},
  
  setCases: (cases) => set({ cases }),
  setLoading: (loading) => set({ loading }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilters: (filters) => set({ filters }),
  
  searchCases: () => {
    const { searchTerm, filters } = get()
    const results = caseStore.searchCases(searchTerm, filters)
    set({ cases: results })
  },
  
  loadAllCases: () => {
    const cases = caseStore.getAllCases()
    set({ cases })
  }
}))