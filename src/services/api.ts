import axios from 'axios'
import { Case, CaseSearchFilters, CaseStats, CorrelationData, AIPerformanceMetrics, AIExtractionRequest } from '../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 无需认证，简化处理
      console.warn('请求失败:', error.message)
    }
    return Promise.reject(error)
  }
)

// AI提取API
export const aiAPI = {
  extractCaseData: async (request: AIExtractionRequest) => {
    const response = await api.post('/ai/extract', request)
    return response.data
  }
}

// 案例API
export const caseAPI = {
  getAllCases: async () => {
    const response = await api.get('/cases')
    return response.data
  },
  
  searchCases: async (filters: CaseSearchFilters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/cases/search?${params.toString()}`)
    return response.data
  },
  
  getCaseById: async (id: string) => {
    const response = await api.get(`/cases/${id}`)
    return response.data
  },
  
  createCase: async (caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/cases', caseData)
    return response.data
  },
  
  updateCase: async (id: string, updates: Partial<Case>) => {
    const response = await api.put(`/cases/${id}`, updates)
    return response.data
  },
  
  deleteCase: async (id: string) => {
    const response = await api.delete(`/cases/${id}`)
    return response.data
  }
}

// 统计API
export const statsAPI = {
  getStats: async () => {
    const response = await api.get('/stats')
    return response.data
  },
  
  getCorrelations: async () => {
    const response = await api.get('/analytics/correlations')
    return response.data
  },
  
  getAIPerformance: async () => {
    const response = await api.get('/analytics/ai-performance')
    return response.data
  }
}

export default api