import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../utils/api'
import { User } from './userStore'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  // 登录
  login: (student_id: string, password: string, additionalData?: any) => Promise<void>
  
  // 注册
  register: (userData: {
    student_id: string
    email: string
    password: string
    name: string
    phone?: string
    dormitory_area?: string
    building_number?: string
    room_number?: string
  }) => Promise<void>
  
  // 登出
  logout: () => void
  
  // 验证token
  verifyToken: () => Promise<boolean>
  
  // 更新用户信息
  updateUser: (userData: Partial<User>) => void
  
  // 清除错误
  clearError: () => void
  
  // 设置加载状态
  setLoading: (loading: boolean) => void
  
  // 重置状态
  reset: () => void
  
  // 检查认证状态
  checkAuth: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (student_id: string, password: string, additionalData?: any) => {
        try {
          set({ isLoading: true, error: null })

          const loginData = {
            student_id,
            password,
            ...additionalData
          }
          const response = await authAPI.login(loginData)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const { user, token } = response

          // 保存token到localStorage，供API拦截器使用
          if (token) {
            localStorage.setItem('auth_token', token)
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '登录失败'
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          })
          throw new Error(errorMessage)
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null })

          const response = await authAPI.register(userData)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const { user, token } = response

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '注册失败'
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          })
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
        
        // 清除localStorage中的认证信息
        localStorage.removeItem('auth-storage')
      },

      verifyToken: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return false
        }

        try {
          set({ isLoading: true, error: null })

          const response = await authAPI.verifyToken()
          
          if (response.error) {
            throw new Error(response.error)
          }

          const user = response.user || response

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          return true

        } catch (error: any) {
          console.error('Token验证失败:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          return false
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      reset: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      checkAuth: async () => {
        const { token } = get()
        if (token) {
          try {
            const isValid = await get().verifyToken()
            if (!isValid) {
              get().logout()
            }
          } catch (error) {
            console.error('Auth check failed:', error)
            get().logout()
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// 辅助函数：检查用户是否已验证
export const isUserVerified = (user: User | null): boolean => {
  return user?.is_verified || false
}

// 辅助函数：获取用户显示名称
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return '未知用户'
  return user.name || user.student_id || '未知用户'
}

// 辅助函数：获取用户头像URL
export const getUserAvatarUrl = (user: User | null): string => {
  return user?.avatar_url || '/default-avatar.png'
}