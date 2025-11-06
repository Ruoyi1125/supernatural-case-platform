import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 创建订单
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      pickup_platform,
      pickup_location,
      delivery_location,
      base_fee,
      urgent_fee = 0,
      special_requirements,
      is_urgent = false,
      pickup_time
    } = req.body

    // 验证必填字段
    if (!pickup_platform || !pickup_location || !delivery_location || !base_fee) {
      return res.status(400).json({
        error: '缺少必填字段',
        message: '取餐平台、取餐地点、送达地点和基础费用为必填项'
      })
    }

    // 验证费用
    if (base_fee < 0 || urgent_fee < 0) {
      return res.status(400).json({
        error: '费用格式错误',
        message: '费用不能为负数'
      })
    }

    // 验证取餐时间
    if (pickup_time) {
      const pickupDate = new Date(pickup_time)
      const now = new Date()
      if (pickupDate <= now) {
        return res.status(400).json({
          error: '取餐时间错误',
          message: '取餐时间必须晚于当前时间'
        })
      }
    }

    // 创建订单
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        creator_id: req.user!.id,
        pickup_platform,
        pickup_location,
        delivery_location,
        base_fee,
        urgent_fee,
        special_requirements: special_requirements || null,
        status: 'pending',
        is_urgent,
        pickup_time: pickup_time || null
      })
      .select(`
        *,
        creator:users!creator_id(
          id, name, avatar_url, dormitory_area, building_number, rating
        )
      `)
      .single()

    if (error) {
      console.error('Create order error:', error)
      return res.status(500).json({
        error: '创建订单失败',
        message: '数据库操作失败，请稍后重试'
      })
    }

    res.status(201).json({
      message: '订单创建成功',
      order: newOrder
    })

  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '创建订单过程中发生错误'
    })
  }
})

// 获取订单列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status,
      platform,
      is_urgent,
      creator_id,
      accepter_id,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        creator:users!creator_id(
          id, name, avatar_url, dormitory_area, building_number, rating
        ),
        accepter:users!accepter_id(
          id, name, avatar_url, dormitory_area, building_number, rating
        )
      `)

    // 应用过滤条件
    if (status) {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('pickup_platform', platform)
    }
    if (is_urgent !== undefined) {
      query = query.eq('is_urgent', is_urgent === 'true')
    }
    if (creator_id) {
      query = query.eq('creator_id', creator_id)
    }
    if (accepter_id) {
      query = query.eq('accepter_id', accepter_id)
    }

    // 排序
    const validSortFields = ['created_at', 'total_fee', 'pickup_time']
    const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at'
    const sortDirection = sort_order === 'asc' ? true : false

    query = query.order(sortField, { ascending: sortDirection })

    // 分页
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Get orders error:', error)
      return res.status(500).json({
        error: '获取订单失败',
        message: '数据库查询失败'
      })
    }

    res.json({
      orders: orders || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })

  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取订单列表失败'
    })
  }
})

// 获取单个订单详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        creator:users!creator_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        ),
        accepter:users!accepter_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 如果用户已登录，检查是否有权限查看联系方式
    let canViewContact = false
    if (req.user) {
      canViewContact = req.user.id === order.creator_id || req.user.id === order.accepter_id
    }

    // 如果没有权限查看联系方式，隐藏手机号
    if (!canViewContact) {
      if (order.creator?.phone) {
        order.creator.phone = order.creator.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
      if (order.accepter?.phone) {
        order.accepter.phone = order.accepter.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      }
    }

    res.json({
      order
    })

  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取订单详情失败'
    })
  }
})

// 接受订单
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // 检查订单是否存在且状态为 pending
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, creator_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查是否是自己的订单
    if (order.creator_id === req.user!.id) {
      return res.status(400).json({
        error: '无法接受自己的订单',
        message: '不能接受自己发布的订单'
      })
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        error: '订单状态错误',
        message: '该订单已被接受或已完成'
      })
    }

    // 更新订单状态
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        accepter_id: req.user!.id,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!creator_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        ),
        accepter:users!accepter_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        )
      `)
      .single()

    if (updateError) {
      console.error('Accept order error:', updateError)
      return res.status(500).json({
        error: '接受订单失败',
        message: '数据库更新失败，请稍后重试'
      })
    }

    res.json({
      message: '订单接受成功',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Accept order error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '接受订单过程中发生错误'
    })
  }
})

// 更新订单状态
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // 验证状态值
    const validStatuses = ['pending', 'accepted', 'picking', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: '无效的状态值',
        message: '订单状态必须是: ' + validStatuses.join(', ')
      })
    }

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, creator_id, accepter_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查权限
    const isCreator = order.creator_id === req.user!.id
    const isAccepter = order.accepter_id === req.user!.id

    if (!isCreator && !isAccepter) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有订单创建者或接受者可以更新订单状态'
      })
    }

    // 状态转换规则验证
    const statusTransitions: { [key: string]: string[] } = {
      'pending': ['cancelled'], // 创建者可以取消
      'accepted': ['picking', 'cancelled'], // 接受者可以开始取餐，创建者可以取消
      'picking': ['completed'], // 接受者可以完成
      'completed': [], // 已完成不能再改变
      'cancelled': [] // 已取消不能再改变
    }

    if (!statusTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        error: '状态转换无效',
        message: `订单当前状态为 ${order.status}，无法转换为 ${status}`
      })
    }

    // 特定状态的权限检查
    if (status === 'picking' && !isAccepter) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有接单者可以开始取餐'
      })
    }

    if (status === 'completed' && !isAccepter) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有接单者可以完成订单'
      })
    }

    // 更新订单状态
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // 如果是完成订单，设置完成时间
    if (status === 'completed') {
      updateData.delivery_time = new Date().toISOString()
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:users!creator_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        ),
        accepter:users!accepter_id(
          id, name, avatar_url, phone, dormitory_area, building_number, rating
        )
      `)
      .single()

    if (updateError) {
      console.error('Update order status error:', updateError)
      return res.status(500).json({
        error: '更新订单状态失败',
        message: '数据库更新失败，请稍后重试'
      })
    }

    // 如果订单完成，更新用户统计
    if (status === 'completed') {
      // 增加接单者的完成订单数
      await supabase.rpc('increment_user_completed_orders', {
        user_id: order.accepter_id
      })
    }

    res.json({
      message: '订单状态更新成功',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '更新订单状态过程中发生错误'
    })
  }
})

// 取消订单
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, creator_id, accepter_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查权限（只有创建者可以取消订单）
    if (order.creator_id !== req.user!.id) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有订单创建者可以取消订单'
      })
    }

    // 检查订单状态（已完成的订单不能取消）
    if (order.status === 'completed') {
      return res.status(400).json({
        error: '无法取消',
        message: '已完成的订单无法取消'
      })
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        error: '订单已取消',
        message: '该订单已经被取消'
      })
    }

    // 更新订单状态为已取消
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Cancel order error:', updateError)
      return res.status(500).json({
        error: '取消订单失败',
        message: '数据库更新失败，请稍后重试'
      })
    }

    res.json({
      message: '订单已取消'
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '取消订单过程中发生错误'
    })
  }
})

// 获取用户的订单统计
router.get('/stats/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params

    // 调用数据库函数获取用户统计
    const { data: stats, error } = await supabase
      .rpc('get_user_stats', { user_id: userId })

    if (error) {
      console.error('Get user stats error:', error)
      return res.status(500).json({
        error: '获取统计失败',
        message: '数据库查询失败'
      })
    }

    res.json({
      stats: stats || {
        total_created_orders: 0,
        total_accepted_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        average_rating: 0
      }
    })

  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取用户统计失败'
    })
  }
})

// 获取订单统计（全局）
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    // 调用数据库函数获取订单统计
    const { data: stats, error } = await supabase
      .rpc('get_order_stats')

    if (error) {
      console.error('Get order stats error:', error)
      return res.status(500).json({
        error: '获取统计失败',
        message: '数据库查询失败'
      })
    }

    res.json({
      stats: stats || {
        pending_orders: 0,
        accepted_orders: 0,
        completed_orders: 0,
        total_orders: 0
      }
    })

  } catch (error) {
    console.error('Get order stats error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取订单统计失败'
    })
  }
})

export default router