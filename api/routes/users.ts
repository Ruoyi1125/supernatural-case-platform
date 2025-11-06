import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 获取用户信息
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select('id, student_id, name, avatar_url, dormitory_area, building_number, rating, completed_orders, is_verified, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '无法找到指定的用户'
      })
    }

    // 如果是查看自己的信息，返回更多详细信息
    if (req.user && req.user.id === userId) {
      const { data: detailedUser, error: detailError } = await supabase
        .from('users')
        .select('id, student_id, email, name, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (detailError) {
        return res.status(500).json({
          error: '获取用户信息失败',
          message: '数据库查询失败'
        })
      }

      return res.json({
        user: detailedUser
      })
    }

    res.json({
      user
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取用户信息失败'
    })
  }
})

// 获取用户列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      dormitory_area,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query

    let query = supabase
      .from('users')
      .select('id, student_id, name, avatar_url, dormitory_area, building_number, rating, completed_orders, is_verified, created_at')

    // 搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%`)
    }

    // 宿舍区域过滤
    if (dormitory_area) {
      query = query.eq('dormitory_area', dormitory_area)
    }

    // 排序
    const validSortFields = ['created_at', 'rating', 'completed_orders', 'name']
    const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at'
    const sortDirection = sort_order === 'asc' ? true : false

    query = query.order(sortField, { ascending: sortDirection })

    // 分页
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Get users error:', error)
      return res.status(500).json({
        error: '获取用户列表失败',
        message: '数据库查询失败'
      })
    }

    res.json({
      users: users || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取用户列表失败'
    })
  }
})

// 更新用户头像
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body

    if (!avatar_url) {
      return res.status(400).json({
        error: '缺少头像URL',
        message: '请提供有效的头像URL'
      })
    }

    // 验证URL格式
    try {
      new URL(avatar_url)
    } catch {
      return res.status(400).json({
        error: '无效的URL格式',
        message: '请提供有效的头像URL'
      })
    }

    // 更新用户头像
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user!.id)
      .select('id, student_id, email, name, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update avatar error:', error)
      return res.status(500).json({
        error: '更新头像失败',
        message: '数据库更新失败，请稍后重试'
      })
    }

    res.json({
      message: '头像更新成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '更新头像过程中发生错误'
    })
  }
})

// 获取用户评价
router.get('/:userId/ratings', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params
    const {
      page = 1,
      limit = 20
    } = req.query

    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({
        error: '用户不存在',
        message: '无法找到指定的用户'
      })
    }

    // 分页
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    // 获取用户评价
    const { data: ratings, error, count } = await supabase
      .from('user_ratings')
      .select(`
        *,
        rater:users!rater_id(
          id, name, avatar_url
        ),
        order:orders!order_id(
          id, pickup_platform, created_at
        )
      `)
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (error) {
      console.error('Get user ratings error:', error)
      return res.status(500).json({
        error: '获取评价失败',
        message: '数据库查询失败'
      })
    }

    res.json({
      ratings: ratings || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })

  } catch (error) {
    console.error('Get user ratings error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取用户评价失败'
    })
  }
})

// 评价用户
router.post('/:userId/rate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { order_id, rating, comment } = req.body

    // 验证必填字段
    if (!order_id || !rating) {
      return res.status(400).json({
        error: '缺少必填字段',
        message: '订单ID和评分为必填项'
      })
    }

    // 验证评分范围
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: '评分范围错误',
        message: '评分必须在1-5之间'
      })
    }

    // 检查是否评价自己
    if (userId === req.user!.id) {
      return res.status(400).json({
        error: '无法评价自己',
        message: '不能给自己评分'
      })
    }

    // 检查订单是否存在以及是否有权限评价
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, creator_id, accepter_id, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查订单是否已完成
    if (order.status !== 'completed') {
      return res.status(400).json({
        error: '订单未完成',
        message: '只能对已完成的订单进行评价'
      })
    }

    // 检查评价权限和被评价用户
    let canRate = false
    if (req.user!.id === order.creator_id && userId === order.accepter_id) {
      // 订单创建者评价接单者
      canRate = true
    } else if (req.user!.id === order.accepter_id && userId === order.creator_id) {
      // 接单者评价订单创建者
      canRate = true
    }

    if (!canRate) {
      return res.status(403).json({
        error: '权限不足',
        message: '只能评价与您有订单关系的用户'
      })
    }

    // 检查是否已经评价过
    const { data: existingRating } = await supabase
      .from('user_ratings')
      .select('id')
      .eq('order_id', order_id)
      .eq('rater_id', req.user!.id)
      .eq('rated_user_id', userId)
      .single()

    if (existingRating) {
      return res.status(409).json({
        error: '已经评价过',
        message: '您已经对此订单的用户进行过评价'
      })
    }

    // 创建评价
    const { data: newRating, error } = await supabase
      .from('user_ratings')
      .insert({
        order_id,
        rater_id: req.user!.id,
        rated_user_id: userId,
        rating,
        comment: comment || null
      })
      .select(`
        *,
        rater:users!rater_id(
          id, name, avatar_url
        ),
        order:orders!order_id(
          id, pickup_platform, created_at
        )
      `)
      .single()

    if (error) {
      console.error('Create rating error:', error)
      return res.status(500).json({
        error: '评价失败',
        message: '数据库操作失败，请稍后重试'
      })
    }

    res.status(201).json({
      message: '评价成功',
      rating: newRating
    })

  } catch (error) {
    console.error('Rate user error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '评价用户过程中发生错误'
    })
  }
})

// 获取宿舍楼列表
router.get('/dormitories/buildings', optionalAuth, async (req, res) => {
  try {
    const { area } = req.query

    let query = supabase
      .from('dormitory_buildings')
      .select('*')
      .order('area')
      .order('building_number')

    // 按区域过滤
    if (area) {
      query = query.eq('area', area)
    }

    const { data: buildings, error } = await query

    if (error) {
      console.error('Get dormitory buildings error:', error)
      return res.status(500).json({
        error: '获取宿舍楼失败',
        message: '数据库查询失败'
      })
    }

    // 按区域分组
    const groupedBuildings = (buildings || []).reduce((acc: any, building) => {
      if (!acc[building.area]) {
        acc[building.area] = []
      }
      acc[building.area].push(building)
      return acc
    }, {})

    res.json({
      buildings: buildings || [],
      grouped: groupedBuildings
    })

  } catch (error) {
    console.error('Get dormitory buildings error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取宿舍楼列表失败'
    })
  }
})

// 验证用户身份
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    // 这里可以实现身份验证逻辑
    // 例如：发送验证邮件、短信验证等
    
    // 暂时直接标记为已验证（实际应用中需要真实的验证流程）
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user!.id)
      .select('id, student_id, email, name, phone, avatar_url, dormitory_area, building_number, room_number, rating, completed_orders, is_verified, created_at, updated_at')
      .single()

    if (error) {
      console.error('Verify user error:', error)
      return res.status(500).json({
        error: '验证失败',
        message: '数据库更新失败，请稍后重试'
      })
    }

    res.json({
      message: '身份验证成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('Verify user error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '身份验证过程中发生错误'
    })
  }
})

export default router