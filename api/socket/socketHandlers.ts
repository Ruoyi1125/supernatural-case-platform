import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AuthenticatedSocket extends Socket {
  userId?: string
  user?: {
    id: string
    name: string
    avatar_url?: string
  }
}

// 存储用户连接信息
const userConnections = new Map<string, Set<string>>() // userId -> Set of socketIds
const socketUsers = new Map<string, string>() // socketId -> userId
const orderRooms = new Map<string, Set<string>>() // orderId -> Set of socketIds

export const setupSocketHandlers = (io: Server) => {
  // 认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token
      const userId = socket.handshake.auth.userId

      if (!token || !userId) {
        return next(new Error('认证失败：缺少token或用户ID'))
      }

      // 验证 JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      if (decoded.userId !== userId) {
        return next(new Error('认证失败：用户ID不匹配'))
      }

      // 从数据库获取用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return next(new Error('认证失败：用户不存在'))
      }

      socket.userId = userId
      socket.user = user
      next()

    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('认证失败：token无效'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    const socketId = socket.id

    console.log(`用户 ${userId} 连接，Socket ID: ${socketId}`)

    // 记录用户连接
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId)!.add(socketId)
    socketUsers.set(socketId, userId)

    // 通知用户上线
    socket.broadcast.emit('user_online', {
      userId,
      user: socket.user
    })

    // 加入订单房间
    socket.on('join_order', async (orderId: string) => {
      try {
        // 验证用户是否有权限加入此订单房间
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, creator_id, accepter_id')
          .eq('id', orderId)
          .single()

        if (error || !order) {
          socket.emit('error', { message: '订单不存在' })
          return
        }

        const isParticipant = order.creator_id === userId || order.accepter_id === userId
        if (!isParticipant) {
          socket.emit('error', { message: '无权限加入此订单房间' })
          return
        }

        // 加入房间
        socket.join(`order_${orderId}`)
        
        // 记录房间信息
        if (!orderRooms.has(orderId)) {
          orderRooms.set(orderId, new Set())
        }
        orderRooms.get(orderId)!.add(socketId)

        console.log(`用户 ${userId} 加入订单房间: ${orderId}`)
        
        // 通知房间内其他用户
        socket.to(`order_${orderId}`).emit('user_joined_order', {
          orderId,
          userId,
          user: socket.user
        })

        socket.emit('joined_order', { orderId })

      } catch (error) {
        console.error('Join order room error:', error)
        socket.emit('error', { message: '加入订单房间失败' })
      }
    })

    // 离开订单房间
    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order_${orderId}`)
      
      // 更新房间记录
      if (orderRooms.has(orderId)) {
        orderRooms.get(orderId)!.delete(socketId)
        if (orderRooms.get(orderId)!.size === 0) {
          orderRooms.delete(orderId)
        }
      }

      console.log(`用户 ${userId} 离开订单房间: ${orderId}`)
      
      // 通知房间内其他用户
      socket.to(`order_${orderId}`).emit('user_left_order', {
        orderId,
        userId,
        user: socket.user
      })

      socket.emit('left_order', { orderId })
    })

    // 发送消息
    socket.on('send_message', async (data: {
      orderId: string
      content: string
      messageType?: 'text' | 'image'
      imageUrl?: string
    }) => {
      try {
        const { orderId, content, messageType = 'text', imageUrl } = data

        // 验证必填字段
        if (!orderId || !content) {
          socket.emit('error', { message: '订单ID和消息内容为必填项' })
          return
        }

        // 验证用户是否在订单房间中
        const rooms = Array.from(socket.rooms)
        if (!rooms.includes(`order_${orderId}`)) {
          socket.emit('error', { message: '请先加入订单房间' })
          return
        }

        // 保存消息到数据库
        const { data: newMessage, error } = await supabase
          .from('messages')
          .insert({
            order_id: orderId,
            sender_id: userId,
            content,
            message_type: messageType,
            image_url: imageUrl || null
          })
          .select(`
            *,
            sender:users!sender_id(
              id, name, avatar_url
            )
          `)
          .single()

        if (error) {
          console.error('Save message error:', error)
          socket.emit('error', { message: '消息发送失败' })
          return
        }

        // 广播消息到订单房间
        io.to(`order_${orderId}`).emit('new_message', newMessage)

        console.log(`用户 ${userId} 在订单 ${orderId} 中发送消息`)

      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('error', { message: '发送消息失败' })
      }
    })

    // 更新订单状态
    socket.on('order_status_update', async (data: {
      orderId: string
      status: string
    }) => {
      try {
        const { orderId, status } = data

        // 验证状态值
        const validStatuses = ['pending', 'accepted', 'picking', 'completed', 'cancelled']
        if (!validStatuses.includes(status)) {
          socket.emit('error', { message: '无效的订单状态' })
          return
        }

        // 获取订单信息并验证权限
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('id, creator_id, accepter_id, status as current_status')
          .eq('id', orderId)
          .single()

        if (fetchError || !order) {
          socket.emit('error', { message: '订单不存在' })
          return
        }

        const isCreator = order.creator_id === userId
        const isAccepter = order.accepter_id === userId

        if (!isCreator && !isAccepter) {
          socket.emit('error', { message: '无权限更新此订单状态' })
          return
        }

        // 状态转换规则验证
        const statusTransitions: { [key: string]: string[] } = {
          'pending': ['cancelled'],
          'accepted': ['picking', 'cancelled'],
          'picking': ['completed'],
          'completed': [],
          'cancelled': []
        }

        if (!statusTransitions[order.current_status]?.includes(status)) {
          socket.emit('error', { 
            message: `订单当前状态为 ${order.current_status}，无法转换为 ${status}` 
          })
          return
        }

        // 特定状态的权限检查
        if (status === 'picking' && !isAccepter) {
          socket.emit('error', { message: '只有接单者可以开始取餐' })
          return
        }

        if (status === 'completed' && !isAccepter) {
          socket.emit('error', { message: '只有接单者可以完成订单' })
          return
        }

        // 更新订单状态
        const updateData: any = {
          status,
          updated_at: new Date().toISOString()
        }

        if (status === 'completed') {
          updateData.delivery_time = new Date().toISOString()
        }

        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)
          .select(`
            *,
            creator:users!creator_id(
              id, name, avatar_url
            ),
            accepter:users!accepter_id(
              id, name, avatar_url
            )
          `)
          .single()

        if (updateError) {
          console.error('Update order status error:', updateError)
          socket.emit('error', { message: '更新订单状态失败' })
          return
        }

        // 如果订单完成，更新用户统计
        if (status === 'completed' && order.accepter_id) {
          await supabase.rpc('increment_user_completed_orders', {
            user_id: order.accepter_id
          })
        }

        // 广播状态更新
        io.to(`order_${orderId}`).emit('order_status_updated', {
          orderId,
          status,
          updatedBy: userId,
          updatedAt: updateData.updated_at,
          order: updatedOrder
        })

        // 如果是新订单被接受，通知创建者
        if (status === 'accepted') {
          const creatorSockets = userConnections.get(order.creator_id)
          if (creatorSockets) {
            creatorSockets.forEach(socketId => {
              io.to(socketId).emit('order_accepted', {
                orderId,
                accepter: socket.user,
                order: updatedOrder
              })
            })
          }
        }

        console.log(`用户 ${userId} 更新订单 ${orderId} 状态为: ${status}`)

      } catch (error) {
        console.error('Update order status error:', error)
        socket.emit('error', { message: '更新订单状态失败' })
      }
    })

    // 新订单通知
    socket.on('new_order_created', async (orderId: string) => {
      try {
        // 获取订单详情
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            creator:users!creator_id(
              id, name, avatar_url, dormitory_area, building_number, rating
            )
          `)
          .eq('id', orderId)
          .single()

        if (error || !order) {
          console.error('Get new order error:', error)
          return
        }

        // 广播新订单给所有在线用户（除了创建者）
        socket.broadcast.emit('new_order', order)

        console.log(`新订单 ${orderId} 已广播`)

      } catch (error) {
        console.error('Broadcast new order error:', error)
      }
    })

    // 用户正在输入
    socket.on('typing', (data: { orderId: string; isTyping: boolean }) => {
      socket.to(`order_${data.orderId}`).emit('user_typing', {
        orderId: data.orderId,
        userId,
        user: socket.user,
        isTyping: data.isTyping
      })
    })

    // 断开连接处理
    socket.on('disconnect', (reason) => {
      console.log(`用户 ${userId} 断开连接，原因: ${reason}`)

      // 清理连接记录
      if (userConnections.has(userId)) {
        userConnections.get(userId)!.delete(socketId)
        if (userConnections.get(userId)!.size === 0) {
          userConnections.delete(userId)
          
          // 通知用户下线
          socket.broadcast.emit('user_offline', {
            userId,
            user: socket.user
          })
        }
      }

      socketUsers.delete(socketId)

      // 清理订单房间记录
      orderRooms.forEach((sockets, orderId) => {
        if (sockets.has(socketId)) {
          sockets.delete(socketId)
          if (sockets.size === 0) {
            orderRooms.delete(orderId)
          }
          
          // 通知房间内其他用户
          socket.to(`order_${orderId}`).emit('user_left_order', {
            orderId,
            userId,
            user: socket.user
          })
        }
      })
    })

    // 错误处理
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error)
    })
  })

  // 定期清理过期连接
  setInterval(() => {
    const now = Date.now()
    io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
      if (now - socket.handshake.time > 24 * 60 * 60 * 1000) { // 24小时
        console.log(`清理过期连接: ${socket.id}`)
        socket.disconnect(true)
      }
    })
  }, 60 * 60 * 1000) // 每小时检查一次

  console.log('Socket.IO 处理器已设置完成')
}

// 导出工具函数
export const getOnlineUsers = (): string[] => {
  return Array.from(userConnections.keys())
}

export const getUserSocketIds = (userId: string): string[] => {
  return Array.from(userConnections.get(userId) || [])
}

export const getOrderRoomUsers = (orderId: string): string[] => {
  const socketIds = orderRooms.get(orderId) || new Set()
  return Array.from(socketIds).map(socketId => socketUsers.get(socketId)).filter(Boolean) as string[]
}