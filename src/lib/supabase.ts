import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: string
  student_id: string
  email: string
  name: string
  phone: string
  avatar_url?: string
  dormitory_area: '东区' | '南区' | '北区' | '本部'
  building_number?: string
  room_number?: string
  rating?: number
  completed_orders?: number
  is_verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  creator_id: string
  accepter_id?: string
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
  total_fee?: number
  special_requirements?: string
  status: 'pending' | 'accepted' | 'picking' | 'delivering' | 'completed' | 'cancelled'
  is_urgent?: boolean
  pickup_time?: string
  delivery_time?: string
  created_at?: string
  updated_at?: string
  creator?: User
  accepter?: User
}

export interface Message {
  id: string
  order_id: string
  sender_id: string
  message_type: 'text' | 'image' | 'system'
  content?: string
  image_url?: string
  created_at?: string
  sender?: User
}

export interface DormitoryBuilding {
  id: string
  area: '东区' | '南区' | '北区' | '本部'
  building_number: string
  building_name: string
  latitude: number
  longitude: number
  created_at?: string
}

export interface UserRating {
  id: string
  rater_id: string
  rated_user_id: string
  order_id: string
  rating: number
  comment?: string
  created_at?: string
  rater?: User
  order?: Order
}

export interface OrderImage {
  id: string
  order_id: string
  uploader_id: string
  image_url: string
  image_type: 'menu' | 'receipt' | 'delivery_proof'
  created_at?: string
}