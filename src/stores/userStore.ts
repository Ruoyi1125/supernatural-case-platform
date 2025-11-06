import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userAPI } from '../utils/api'

export interface User {
  id: string
  student_id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  dormitory_area?: string
  building_number?: string
  room_number?: string
  rating: number
  completed_orders: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserRating {
  id: string
  rater_id: string
  rated_user_id: string
  order_id: string
  rating: number
  comment?: string
  created_at: string
  rater: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface DormitoryBuilding {
  id: string
  name: string
  area: string
  latitude: number
  longitude: number
}

interface UserStats {
  total_orders: number
  completed_orders: number
  average_rating: number
  total_earnings: number
  success_rate: number
}

interface UserState {
  users: User[]
  currentUser: User | null
  userRatings: UserRating[]
  dormitoryBuildings: DormitoryBuilding[]
  stats: UserStats | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    search?: string
    dormitory_building?: string
    is_verified?: boolean
    sort_by?: string
    sort_order?: string
  }
}

interface UserActions {
  // 获取用户列表
  fetchUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    dormitory_building?: string
    is_verified?: boolean
    sort_by?: string
    sort_order?: string
  }) => Promise<void>
  
  // 获取单个用户信息
  fetchUser: (userId: string) => Promise<User>
  
  // 获取用户统计
  fetchUserStats: () => Promise<void>
  
  // 更新用户资料
  updateProfile: (userData: Partial<User>) => Promise<void>
  
  // 更新用户头像
  updateAvatar: (file: File) => Promise<void>
  
  // 修改密码
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  // 获取用户评价
  fetchUserRatings: (userId: string) => Promise<void>
  
  // 评价用户
  rateUser: (data: {
    rated_user_id: string
    order_id: string
    rating: number
    comment?: string
  }) => Promise<UserRating>
  
  // 获取宿舍楼列表
  fetchDormitoryBuildings: () => Promise<void>
  
  // 设置过滤器
  setFilters: (filters: Partial<UserState['filters']>) => void
  
  // 清除错误
  clearError: () => void
  
  // 设置加载状态
  setLoading: (loading: boolean) => void
  
  // 重置状态
  reset: () => void
}

type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      users: [],
      currentUser: null,
      userRatings: [],
      dormitoryBuildings: [],
      stats: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      filters: {},

      // Actions
      fetchUsers: async (params = {}) => {
        try {
          set({ isLoading: true, error: null })

          const response = await userAPI.getUsers(params)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const { users, pagination } = response.data

          set({
            users,
            pagination,
            isLoading: false,
            error: null
          })

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '获取用户列表失败'
          set({
            isLoading: false,
            error: errorMessage
          })
          throw new Error(errorMessage)
        }
      },

      fetchUser: async (userId: string) => {
        try {
          set({ isLoading: true, error: null })

          const response = await userAPI.getUser(userId)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const user = response.data

          set({
            currentUser: user,
            isLoading: false,
            error: null
          })

          return user

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '获取用户信息失败'
          set({
            isLoading: false,
            error: errorMessage
          })
          throw new Error(errorMessage)
        }
      },

      fetchUserStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.getStats();
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          set({ stats: response.data, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '获取用户统计失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      fetchDormitoryBuildings: async () => {
        try {
          const response = await userAPI.getDormitoryBuildings();
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          set({ dormitoryBuildings: response.data });
        } catch (error: any) {
          console.error('获取宿舍楼信息失败:', error);
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.updateProfile(userData);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          // 更新认证 store 中的用户信息
          const { useAuthStore } = await import('./authStore');
          useAuthStore.getState().updateUser(response.data);
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '更新资料失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      updateAvatar: async (avatarFile) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.updateAvatar(avatarFile);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          // 更新认证 store 中的用户信息
          const { useAuthStore } = await import('./authStore');
          useAuthStore.getState().updateUser({ avatar_url: response.data.avatar_url });
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '更新头像失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.changePassword(currentPassword, newPassword);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '修改密码失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      fetchUserRatings: async (userId: string) => {
        try {
          set({ isLoading: true, error: null })

          const response = await userAPI.getUserRatings(userId)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const ratings = response.data

          set({
            userRatings: ratings,
            isLoading: false,
            error: null
          })

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '获取用户评价失败'
          set({
            isLoading: false,
            error: errorMessage
          })
          throw new Error(errorMessage)
        }
      },

      rateUser: async (data) => {
        try {
          set({ isLoading: true, error: null })

          const response = await userAPI.rateUser(data)
          
          if (response.error) {
            throw new Error(response.error)
          }

          const rating = response.data

          // 添加到评价列表
          set((state) => ({
            userRatings: [rating, ...state.userRatings],
            isLoading: false,
            error: null
          }))

          return rating

        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || '评价用户失败'
          set({
            isLoading: false,
            error: errorMessage
          })
          throw new Error(errorMessage)
        }
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      reset: () => {
        set({
          users: [],
          currentUser: null,
          userRatings: [],
          isLoading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
          },
          filters: {}
        })
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        stats: state.stats,
        dormitoryBuildings: state.dormitoryBuildings,
      }),
    }
  )
);

// 辅助函数：计算用户平均评分
export const calculateAverageRating = (ratings: UserRating[]): number => {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

// 辅助函数：获取用户评分分布
export const getRatingDistribution = (ratings: UserRating[]): Record<number, number> => {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  
  ratings.forEach(rating => {
    distribution[rating.rating] = (distribution[rating.rating] || 0) + 1
  })
  
  return distribution
}