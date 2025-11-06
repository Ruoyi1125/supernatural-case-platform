import express from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin, TABLES } from '../config/supabase.js';
import { 
  validate, 
  validateEmail, 
  validatePhone, 
  validatePassword,
  validateDormitoryArea 
} from '../utils/validation.js';

const router = express.Router();

// 更新用户信息验证规则
const updateProfileValidation = {
  name: {
    required: false,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  email: {
    required: false,
    type: 'string',
    validator: validateEmail,
    message: 'Invalid email format'
  },
  phone: {
    required: false,
    type: 'string',
    validator: validatePhone,
    message: 'Invalid phone number format'
  },
  dormitory_area: {
    required: false,
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

// 修改密码验证规则
const changePasswordValidation = {
  current_password: {
    required: true,
    type: 'string',
    minLength: 1
  },
  new_password: {
    required: true,
    type: 'string',
    validator: validatePassword,
    message: 'Password must be at least 6 characters with letters and numbers'
  }
};

// 获取当前用户信息
router.get('/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, student_id, name, email, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// 更新用户信息
router.put('/profile', validate(updateProfileValidation), async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'email', 'phone', 'dormitory_area', 'building_number', 'room_number'];

    // 只更新提供的字段
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // 如果更新邮箱，检查是否已存在
    if (updates.email) {
      const { data: existingUser } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('id')
        .eq('email', updates.email)
        .neq('id', req.user.id)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', req.user.id)
      .select('id, student_id, name, email, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 修改密码
router.put('/password', validate(changePasswordValidation), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // 获取当前用户的密码哈希
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // 加密新密码
    const saltRounds = 12;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // 更新密码
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ 
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Change password error:', updateError);
      return res.status(500).json({ error: 'Failed to change password' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// 更新头像
router.put('/avatar', async (req, res) => {
  try {
    const { avatar_url } = req.body;

    if (!avatar_url || typeof avatar_url !== 'string') {
      return res.status(400).json({ error: 'Valid avatar URL is required' });
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ 
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, student_id, name, email, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ error: 'Failed to update avatar' });
    }

    res.json({
      message: 'Avatar updated successfully',
      user
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取订单统计
    const { data: orderStats, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('status, total_fee')
      .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`);

    if (orderError) {
      console.error('Get order stats error:', orderError);
      return res.status(500).json({ error: 'Failed to get order statistics' });
    }

    // 计算统计数据
    const stats = {
      total_orders: orderStats.length,
      completed_orders: orderStats.filter(order => order.status === 'completed').length,
      pending_orders: orderStats.filter(order => order.status === 'pending').length,
      in_progress_orders: orderStats.filter(order => 
        ['accepted', 'picking', 'delivering'].includes(order.status)
      ).length,
      total_earnings: orderStats
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total_fee || 0), 0)
    };

    // 获取评价统计
    const { data: ratings, error: ratingError } = await supabaseAdmin
      .from(TABLES.USER_RATINGS)
      .select('rating')
      .eq('rated_user_id', userId);

    if (!ratingError && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      stats.average_rating = Math.round(avgRating * 10) / 10;
      stats.total_ratings = ratings.length;
    } else {
      stats.average_rating = 5.0;
      stats.total_ratings = 0;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// 获取宿舍楼列表
router.get('/dormitories', async (req, res) => {
  try {
    const { data: dormitories, error } = await supabaseAdmin
      .from(TABLES.DORMITORY_BUILDINGS)
      .select('*')
      .order('area')
      .order('building_number');

    if (error) {
      console.error('Get dormitories error:', error);
      return res.status(500).json({ error: 'Failed to get dormitories' });
    }

    // 按区域分组
    const groupedDormitories = dormitories.reduce((acc, dorm) => {
      if (!acc[dorm.area]) {
        acc[dorm.area] = [];
      }
      acc[dorm.area].push(dorm);
      return acc;
    }, {});

    res.json({ dormitories: groupedDormitories });
  } catch (error) {
    console.error('Get dormitories error:', error);
    res.status(500).json({ error: 'Failed to get dormitories' });
  }
});

// 获取用户详情（公开信息）
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, student_id, name, avatar_url, dormitory_area, building_number, rating, completed_orders, is_verified, created_at')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 获取用户评价
    const { data: ratings, error: ratingError } = await supabaseAdmin
      .from(TABLES.USER_RATINGS)
      .select('rating, comment, created_at, rater_id, users!user_ratings_rater_id_fkey(name)')
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!ratingError) {
      user.recent_ratings = ratings;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

export default router;