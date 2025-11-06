import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 扩展 Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        role: string
      }
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

// JWT 认证中间件
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({ error: '未提供访问令牌' })
      return
    }

    // 验证 JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // 从数据库获取用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      res.status(401).json({ error: '无效的访问令牌' })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(403).json({ error: '访问令牌已过期或无效' })
  }
}

// 可选认证中间件（用于某些可以匿名访问的接口）
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', decoded.userId)
        .single()

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }

    next()
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next()
  }
}

// 验证复旦学号格式
export const validateStudentId = (studentId: string): boolean => {
  // 复旦学号格式：通常为8位数字，以年份开头
  const studentIdRegex = /^(19|20|21|22|23|24|25)\d{6}$/
  return studentIdRegex.test(studentId)
}

// 验证复旦邮箱格式
export const validateFudanEmail = (email: string): boolean => {
  // 复旦邮箱格式：学号@fudan.edu.cn 或 学号@m.fudan.edu.cn
  const emailRegex = /^(19|20|21|22|23|24|25)\d{6}@(m\.)?fudan\.edu\.cn$/
  return emailRegex.test(email)
}

// 生成 JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// 验证密码强度
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少为6位' }
  }
  
  if (password.length > 50) {
    return { valid: false, message: '密码长度不能超过50位' }
  }
  
  // 可以添加更多密码复杂度要求
  // const hasUpperCase = /[A-Z]/.test(password)
  // const hasLowerCase = /[a-z]/.test(password)
  // const hasNumbers = /\d/.test(password)
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return { valid: true }
}