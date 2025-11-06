import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 发送消息
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      order_id,
      content,
      message_type = 'text',
      image_url
    } = req.body

    // 验证必填字段
    if (!order_id || !content) {
      return res.status(400).json({
        error: '缺少必填字段',
        message: '订单ID和消息内容为必填项'
      })
    }

    // 验证消息类型
    const validMessageTypes = ['text', 'image', 'system']
    if (!validMessageTypes.includes(message_type)) {
      return res.status(400).json({
        error: '无效的消息类型',
        message: '消息类型必须是: ' + validMessageTypes.join(', ')
      })
    }

    // 验证图片消息
    if (message_type === 'image' && !image_url) {
      return res.status(400).json({
        error: '缺少图片URL',
        message: '图片消息必须包含图片URL'
      })
    }

    // 检查订单是否存在以及用户是否有权限发送消息
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

    // 检查用户是否是订单的参与者
    const isParticipant = order.creator_id === req.user!.id || order.accepter_id === req.user!.id
    if (!isParticipant) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有订单参与者可以发送消息'
      })
    }

    // 检查订单状态（已取消的订单不能发送消息）
    if (order.status === 'cancelled') {
      return res.status(400).json({
        error: '订单已取消',
        message: '已取消的订单无法发送消息'
      })
    }

    // 创建消息
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        order_id,
        sender_id: req.user!.id,
        content,
        message_type,
        image_url: image_url || null
      })
      .select(`
        *,
        sender:users!sender_id(
          id, name, avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Create message error:', error)
      return res.status(500).json({
        error: '发送消息失败',
        message: '数据库操作失败，请稍后重试'
      })
    }

    res.status(201).json({
      message: '消息发送成功',
      data: newMessage
    })

  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '发送消息过程中发生错误'
    })
  }
})

// 获取订单的消息列表
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const {
      page = 1,
      limit = 50,
      before_id,
      after_id
    } = req.query

    // 检查订单是否存在以及用户是否有权限查看消息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查用户是否是订单的参与者
    const isParticipant = order.creator_id === req.user!.id || order.accepter_id === req.user!.id
    if (!isParticipant) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有订单参与者可以查看消息'
      })
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(
          id, name, avatar_url
        )
      `)
      .eq('order_id', orderId)

    // 分页查询
    if (before_id) {
      // 获取指定消息之前的消息
      query = query.lt('id', before_id)
    } else if (after_id) {
      // 获取指定消息之后的消息
      query = query.gt('id', after_id)
    }

    // 排序和分页
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    query = query
      .order('created_at', { ascending: false })
      .limit(limitNum)

    const { data: messages, error } = await query

    if (error) {
      console.error('Get messages error:', error)
      return res.status(500).json({
        error: '获取消息失败',
        message: '数据库查询失败'
      })
    }

    // 反转消息顺序，使最新的消息在最后
    const sortedMessages = (messages || []).reverse()

    res.json({
      messages: sortedMessages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        has_more: (messages || []).length === limitNum
      }
    })

  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取消息列表失败'
    })
  }
})

// 获取用户的所有对话列表
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    // 获取用户参与的所有订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        creator_id,
        accepter_id,
        pickup_platform,
        status,
        created_at,
        creator:users!creator_id(
          id, name, avatar_url
        ),
        accepter:users!accepter_id(
          id, name, avatar_url
        )
      `)
      .or(`creator_id.eq.${req.user!.id},accepter_id.eq.${req.user!.id}`)
      .not('accepter_id', 'is', null) // 只包含已被接受的订单
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Get conversations error:', ordersError)
      return res.status(500).json({
        error: '获取对话列表失败',
        message: '数据库查询失败'
      })
    }

    // 为每个订单获取最新消息
    const conversations = await Promise.all(
      (orders || []).map(async (order) => {
        // 获取最新消息
        const { data: latestMessage } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            message_type,
            created_at,
            sender:users!sender_id(
              id, name
            )
          `)
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // 获取未读消息数量
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('order_id', order.id)
          .neq('sender_id', req.user!.id)
          .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24小时内的消息

        // 确定对话对象
        const isCreator = order.creator_id === req.user!.id
        const otherUser = isCreator ? order.accepter : order.creator

        return {
          order_id: order.id,
          order_status: order.status,
          pickup_platform: order.pickup_platform,
          other_user: otherUser,
          latest_message: latestMessage,
          unread_count: unreadCount || 0,
          updated_at: latestMessage?.created_at || order.created_at
        }
      })
    )

    // 按最新消息时间排序
    conversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    res.json({
      conversations
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取对话列表失败'
    })
  }
})

// 标记消息为已读
router.put('/order/:orderId/read', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params

    // 检查订单是否存在以及用户是否有权限
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({
        error: '订单不存在',
        message: '无法找到指定的订单'
      })
    }

    // 检查用户是否是订单的参与者
    const isParticipant = order.creator_id === req.user!.id || order.accepter_id === req.user!.id
    if (!isParticipant) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有订单参与者可以标记消息为已读'
      })
    }

    // 这里可以实现消息已读状态的更新逻辑
    // 由于当前数据库结构中没有已读状态字段，这里只是返回成功
    // 在实际应用中，可能需要添加 message_reads 表来跟踪已读状态

    res.json({
      message: '消息已标记为已读'
    })

  } catch (error) {
    console.error('Mark messages as read error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '标记消息已读失败'
    })
  }
})

// 删除消息
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params

    // 获取消息信息
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id, order_id, created_at')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return res.status(404).json({
        error: '消息不存在',
        message: '无法找到指定的消息'
      })
    }

    // 检查权限（只有发送者可以删除消息）
    if (message.sender_id !== req.user!.id) {
      return res.status(403).json({
        error: '权限不足',
        message: '只有消息发送者可以删除消息'
      })
    }

    // 检查消息是否可以删除（例如：只能删除5分钟内的消息）
    const messageTime = new Date(message.created_at).getTime()
    const now = new Date().getTime()
    const fiveMinutes = 5 * 60 * 1000

    if (now - messageTime > fiveMinutes) {
      return res.status(400).json({
        error: '无法删除',
        message: '只能删除5分钟内发送的消息'
      })
    }

    // 删除消息
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('Delete message error:', deleteError)
      return res.status(500).json({
        error: '删除消息失败',
        message: '数据库操作失败，请稍后重试'
      })
    }

    res.json({
      message: '消息已删除'
    })

  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '删除消息过程中发生错误'
    })
  }
})

export default router