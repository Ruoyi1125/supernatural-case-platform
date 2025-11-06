import axios from 'axios'
import type { User, Order, Message, DormitoryBuilding, UserRating } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authAPI = {
  // 用户注册
  register: (data: {
    student_id: string
    email: string
    name: string
    phone: string
    password: string
    dormitory_area: string
    building_number?: string
    room_number?: string
  }) => api.post('/api/auth/register', data),

  // 用户登录
  login: (data: { student_id: string; password: string }) =>
    api.post('/api/auth/login', data),

  // 获取当前用户信息
  me: () => api.get('/api/auth/me'),

  // 更新用户信息
  updateProfile: (data: Partial<User>) => api.put('/api/auth/profile', data),

  // 修改密码
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/api/auth/password', data),
}

// 订单相关 API
export const orderAPI = {
  // 获取订单列表
  getOrders: (params?: {
    status?: string
    area?: string
    platform?: string
    is_urgent?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) => api.get('/api/orders', { params }),

  // 获取单个订单详情
  getOrder: (id: string) => api.get(`/api/orders/${id}`),

  // 创建订单
  createOrder: (data: {
    pickup_platform: string
    pickup_location: {
      name: string
      address: string
      latitude: number
      longitude: number
    }
    delivery_location: {
      name: string
      address: string
      latitude: number
      longitude: number
    }
    base_fee: number
    urgent_fee?: number
    special_requirements?: string
    is_urgent?: boolean
    pickup_time?: string
  }) => api.post('/api/orders', data),

  // 接受订单
  acceptOrder: (id: string) => api.post(`/api/orders/${id}/accept`),

  // 更新订单状态
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/api/orders/${id}/status`, { status }),

  // 获取附近订单
  getNearbyOrders: (params: {
    latitude: number
    longitude: number
    radius?: number
  }) => api.get('/api/orders/nearby', { params }),

  // 删除订单
  deleteOrder: (id: string) => api.delete(`/api/orders/${id}`),
}

// 消息相关 API
export const messageAPI = {
  // 获取订单消息列表
  getOrderMessages: (orderId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/api/messages/order/${orderId}`, { params }),

  // 发送消息
  sendMessage: (data: {
    order_id: string
    content?: string
    message_type?: 'text' | 'image'
    image_url?: string
  }) => api.post('/api/messages', data),

  // 标记消息为已读
  markAsRead: (orderId: string) => api.put(`/api/messages/order/${orderId}/read`),

  // 获取未读消息数量
  getUnreadCount: () => api.get('/api/messages/unread-count'),

  // 获取对话列表
  getConversations: () => api.get('/api/messages/conversations'),

  // 删除消息
  deleteMessage: (id: string) => api.delete(`/api/messages/${id}`),
}

// 用户相关 API
export const userAPI = {
  // 获取用户信息
  getUser: (id: string) => api.get(`/api/users/${id}`),

  // 获取用户完整信息
  getUserFull: (id: string) => api.get(`/api/users/${id}/full`),

  // 获取用户订单历史
  getUserOrders: (id: string, params?: {
    type?: 'created' | 'accepted'
    status?: string
    page?: number
    limit?: number
  }) => api.get(`/api/users/${id}/orders`, { params }),

  // 获取用户评价列表
  getUserRatings: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/api/users/${id}/ratings`, { params }),

  // 评价用户
  rateUser: (data: {
    rated_user_id: string
    order_id: string
    rating: number
    comment?: string
  }) => api.post('/api/users/rate', data),

  // 获取宿舍楼列表
  getDormitoryBuildings: () => api.get('/api/users/dormitory-buildings'),

  // 搜索用户
  searchUsers: (params: { query: string; limit?: number }) =>
    api.get('/api/users/search', { params }),
}

// 文件上传相关 API
export const uploadAPI = {
  // 上传订单图片
  uploadOrderImage: (orderId: string, file: File, imageType: 'menu' | 'receipt' | 'delivery_proof') => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('image_type', imageType)
    return api.post(`/api/upload/order/${orderId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 获取订单图片列表
  getOrderImages: (orderId: string) => api.get(`/api/upload/order/${orderId}/images`),

  // 删除图片
  deleteImage: (imageId: string) => api.delete(`/api/upload/image/${imageId}`),

  // 上传用户头像
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// 导出默认 API 实例
export default api