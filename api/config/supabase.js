import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// 服务端客户端（使用 service role key，绕过 RLS）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 客户端（使用 anon key，遵循 RLS）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  ORDERS: 'orders',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  USER_RATINGS: 'user_ratings',
  DORMITORIES: 'dormitories',
  DORMITORY_BUILDINGS: 'dormitory_buildings',
  ORDER_IMAGES: 'order_images'
};

// 订单状态枚举
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKING: 'picking',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 消息类型枚举
export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system'
};

// 平台类型枚举
export const PLATFORM_TYPE = {
  MEITUAN: 'meituan',
  ELEME: 'eleme',
  OTHER: 'other'
};

// 用户角色枚举
export const USER_ROLE = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

// 错误处理工具函数
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST116') {
    return { error: 'Resource not found', status: 404 };
  }
  
  if (error.code === '23505') {
    return { error: 'Resource already exists', status: 409 };
  }
  
  if (error.code === '23503') {
    return { error: 'Invalid reference', status: 400 };
  }
  
  return { 
    error: error.message || 'Database operation failed', 
    status: 500 
  };
};