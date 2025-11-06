import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, TABLES } from '../config/supabase.js';
import { 
  validate, 
  validateStudentId, 
  validateEmail, 
  validatePhone, 
  validatePassword,
  validateDormitoryArea 
} from '../utils/validation.js';

const router = express.Router();

// 注册验证规则
const registerValidation = {
  student_id: {
    required: true,
    type: 'string',
    validator: validateStudentId,
    message: 'Student ID must be 8 digits'
  },
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  email: {
    required: true,
    type: 'string',
    validator: validateEmail,
    message: 'Invalid email format'
  },
  phone: {
    required: true,
    type: 'string',
    validator: validatePhone,
    message: 'Invalid phone number format'
  },
  password: {
    required: true,
    type: 'string',
    validator: validatePassword,
    message: 'Password must be at least 6 characters with letters and numbers'
  },
  dormitory_area: {
    required: true,
    type: 'string',
    validator: validateDormitoryArea,
    message: 'Invalid dormitory area'
  },
  building_number: {
    required: false,
    type: 'string',
    maxLength: 10
  },
  room_number: {
    required: false,
    type: 'string',
    maxLength: 10
  }
};

// 登录验证规则
const loginValidation = {
  student_id: {
    required: true,
    type: 'string',
    validator: validateStudentId,
    message: 'Student ID must be 8 digits'
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1
  }
};

// 生成 JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 用户注册
router.post('/register', validate(registerValidation), async (req, res) => {
  try {
    const {
      student_id,
      name,
      email,
      phone,
      password,
      dormitory_area,
      building_number,
      room_number
    } = req.body;

    // 检查学号是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id')
      .eq('student_id', student_id)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Student ID already registered' });
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 加密密码
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .insert({
        student_id,
        name,
        email,
        phone,
        password_hash,
        dormitory_area,
        building_number,
        room_number,
        is_verified: false,
        rating: 5.0,
        completed_orders: 0
      })
      .select('id, student_id, name, email, phone, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 用户登录/自动注册
router.post('/login', async (req, res) => {
  try {
    const {
      student_id,
      password,
      name,
      email,
      phone,
      dormitory_area,
      building_number,
      room_number
    } = req.body;

    // 查找用户
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*')
      .eq('student_id', student_id)
      .single();

    let user;

    if (existingUser) {
      // 用户存在，验证密码
      const isValidPassword = await bcrypt.compare(password, existingUser.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: '学号或密码错误' });
      }
      user = existingUser;
    } else {
      // 用户不存在，自动创建新用户
      if (!name || !email) {
        return res.status(400).json({ 
          error: '首次登录需要提供姓名和邮箱信息' 
        });
      }

      // 检查邮箱是否已被使用
      const { data: existingEmail } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return res.status(409).json({ error: '该邮箱已被注册' });
      }

      // 加密密码
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // 创建新用户
      const { data: newUser, error: createError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          student_id,
          name,
          email,
          phone,
          password_hash,
          dormitory_area,
          building_number,
          room_number,
          is_verified: false,
          rating: 5.0,
          completed_orders: 0
        })
        .select('id, student_id, name, email, phone, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at')
        .single();

      if (createError) {
        console.error('Auto registration error:', createError);
        return res.status(500).json({ error: '自动注册失败，请稍后重试' });
      }

      user = newUser;
    }

    // 生成 token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: existingUser ? '登录成功' : '注册并登录成功',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login/Auto-register error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 验证 token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, student_id, name, email, phone, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// 刷新 token
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 验证旧 token（即使过期也要能解析）
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // 检查用户是否仍然有效
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // 生成新 token
    const newToken = generateToken(user.id);

    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

export default router;