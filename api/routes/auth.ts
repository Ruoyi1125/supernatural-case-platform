import express from 'express'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { 
  authenticateToken, 
  generateToken, 
  validateStudentId, 
  validateFudanEmail, 
  validatePassword 
} from '../middleware/auth.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 注册
router.post('/register', async (req, res) => {
  try {
    const { 
      student_id, 
      email, 
      password, 
      name, 
      phone, 
      dormitory_area, 
      building_number, 
      room_number 
    } = req.body

    // 验证必填字段
    if (!student_id || !email || !password || !name || !dormitory_area) {
      return res.status(400).json({ 
        error: '缺少必填字段',
        message: '学号、邮箱、密码、姓名和宿舍区域为必填项'
      })
    }

    // 验证学号格式
    if (!validateStudentId(student_id)) {
      return res.status(400).json({ 
        error: '学号格式错误',
        message: '请输入有效的复旦大学学号'
      })
    }

    // 验证邮箱格式
    if (!validateFudanEmail(email)) {
      return res.status(400).json({ 
        error: '邮箱格式错误',
        message: '请使用复旦大学邮箱注册'
      })
    }

    // 验证密码强度
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: '密码格式错误',
        message: passwordValidation.message
      })
    }

    // 检查学号是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', student_id)
      .single()

    if (existingUser) {
      return res.status(409).json({ 
        error: '学号已存在',
        message: '该学号已被注册，请使用其他学号或尝试登录'
      })
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return res.status(409).json({ 
        error: '邮箱已存在',
        message: '该邮箱已被注册，请使用其他邮箱或尝试登录'
      })
    }

    // 加密密码
    const saltRounds = 12
    const password_hash = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        student_id,
        email,
        password_hash,
        name,
        phone: phone || null,
        dormitory_area,
        building_number: building_number || null,
        room_number: room_number || null,
        rating: 5.0,
        completed_orders: 0,
        is_verified: false
      })
      .select('id, student_id, email, name, phone, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at')
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ 
        error: '注册失败',
        message: '数据库操作失败，请稍后重试'
      })
    }

    // 生成 JWT token
    const token = generateToken(newUser.id)

    res.status(201).json({
      message: '注册成功',
      user: newUser,
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      error: '服务器错误',
      message: '注册过程中发生错误，请稍后重试'
    })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { student_id, password } = req.body

    // 验证必填字段
    if (!student_id || !password) {
      return res.status(400).json({ 
        error: '缺少必填字段',
        message: '请输入学号和密码'
      })
    }

    // 验证学号格式
    if (!validateStudentId(student_id)) {
      return res.status(400).json({ 
        error: '学号格式错误',
        message: '请输入有效的复旦大学学号'
      })
    }

    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', student_id)
      .single()

    if (error || !user) {
      return res.status(401).json({ 
        error: '登录失败',
        message: '学号或密码错误'
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: '登录失败',
        message: '学号或密码错误'
      })
    }

    // 生成 JWT token
    const token = generateToken(user.id)

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      message: '登录成功',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: '服务器错误',
      message: '登录过程中发生错误，请稍后重试'
    })
  }
})

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, student_id, email, name, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
      .eq('id', req.user!.id)
      .single()

    if (error || !user) {
      return res.status(404).json({ 
        error: '用户不存在',
        message: '无法找到用户信息'
      })
    }

    res.json({
      user
    })

  } catch (error) {
    console.error('Get user info error:', error)
    res.status(500).json({ 
      error: '服务器错误',
      message: '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      dormitory_area, 
      building_number, 
      room_number 
    } = req.body

    // 验证必填字段
    if (!name || !dormitory_area) {
      return res.status(400).json({ 
        error: '缺少必填字段',
        message: '姓名和宿舍区域为必填项'
      })
    }

    // 更新用户信息
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        phone: phone || null,
        dormitory_area,
        building_number: building_number || null,
        room_number: room_number || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user!.id)
      .select('id, student_id, email, name, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return res.status(500).json({ 
        error: '更新失败',
        message: '更新用户信息失败，请稍后重试'
      })
    }

    res.json({
      message: '更新成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ 
      error: '服务器错误',
      message: '更新用户信息过程中发生错误'
    })
  }
})

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body

    // 验证必填字段
    if (!current_password || !new_password) {
      return res.status(400).json({ 
        error: '缺少必填字段',
        message: '请输入当前密码和新密码'
      })
    }

    // 验证新密码强度
    const passwordValidation = validatePassword(new_password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: '新密码格式错误',
        message: passwordValidation.message
      })
    }

    // 获取用户当前密码
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user!.id)
      .single()

    if (error || !user) {
      return res.status(404).json({ 
        error: '用户不存在',
        message: '无法找到用户信息'
      })
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        error: '当前密码错误',
        message: '请输入正确的当前密码'
      })
    }

    // 加密新密码
    const saltRounds = 12
    const new_password_hash = await bcrypt.hash(new_password, saltRounds)

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user!.id)

    if (updateError) {
      console.error('Update password error:', updateError)
      return res.status(500).json({ 
        error: '密码更新失败',
        message: '更新密码失败，请稍后重试'
      })
    }

    res.json({
      message: '密码修改成功'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ 
      error: '服务器错误',
      message: '修改密码过程中发生错误'
    })
  }
})

// 验证 token 有效性
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  })
})

export default router