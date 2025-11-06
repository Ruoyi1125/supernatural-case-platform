import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  ORDERS: 'orders',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  USER_RATINGS: 'user_ratings',
  DORMITORIES: 'dormitories',
} as const

// 订单状态枚举
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKING: 'picking',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// 消息类型枚举
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
} as const

// 平台类型枚举
export const PLATFORM_TYPE = {
  MEITUAN: 'meituan',
  ELEME: 'eleme',
  OTHER: 'other',
} as const

// 用户角色枚举
export const USER_ROLE = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const

// 数据库类型定义
export interface User {
  id: string
  student_id: string
  name: string
  email?: string
  phone?: string
  avatar_url?: string
  dormitory_building: string
  room_number: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  deliverer_id?: string
  pickup_platform: string
  pickup_location: {
    name?: string
    address: string
    phone?: string
    latitude?: number
    longitude?: number
  }
  delivery_location: {
    address: string
    phone?: string
    latitude?: number
    longitude?: number
  }
  pickup_time?: string
  base_fee: number
  urgent_fee?: number
  is_urgent: boolean
  special_requirements?: string
  status: string
  rating?: number
  rating_comment?: string
  cancel_reason?: string
  created_at: string
  updated_at: string
  user?: User
  deliverer?: User
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: string
  image_urls?: string[]
  is_read: boolean
  created_at: string
  sender?: User
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  order_id?: string
  last_message_id?: string
  created_at: string
  updated_at: string
  user1?: User
  user2?: User
  last_message?: Message
  order?: Order
  unread_count?: number
  other_user?: User
}

export interface UserRating {
  id: string
  rater_id: string
  rated_user_id: string
  order_id: string
  rating: number
  comment?: string
  created_at: string
  rater?: User
  order?: Order
}

export interface Dormitory {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  is_active: boolean
  created_at: string
}

// 实用工具函数
export const formatSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '操作失败，请重试'
}

export const handleSupabaseResponse = <T>(response: { data: T | null; error: any }) => {
  if (response.error) {
    throw new Error(formatSupabaseError(response.error))
  }
  return response.data
}