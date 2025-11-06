import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// 服务端使用service role key，拥有完整权限
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 数据库表类型定义
export interface User {
  id: string
  name: string
  phone: string
  student_id: string
  dormitory_building: string
  dormitory_room: string
  avatar_url?: string
  rating: number
  total_orders: number
  completed_orders: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  creator_id: string
  accepter_id?: string
  pickup_platform: string
  pickup_location: {
    name: string
    address: string
    latitude?: number
    longitude?: number
  }
  delivery_location: {
    name: string
    address: string
    latitude?: number
    longitude?: number
  }
  base_fee: number
  urgent_fee?: number
  special_requirements?: string
  expected_pickup_time?: string
  status: 'pending' | 'accepted' | 'picking' | 'delivering' | 'completed' | 'cancelled'
  is_urgent: boolean
  created_at: string
  updated_at: string
  creator?: User
  accepter?: User
}

export interface Message {
  id: string
  order_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: User
}

export interface OrderImage {
  id: string
  order_id: string
  image_url: string
  image_type: 'menu' | 'receipt' | 'delivery_proof'
  uploaded_by: string
  created_at: string
}

export interface UserRating {
  id: string
  order_id: string
  rater_id: string
  rated_user_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface DormitoryBuilding {
  id: string
  name: string
  latitude: number
  longitude: number
  created_at: string
}