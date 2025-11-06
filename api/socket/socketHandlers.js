import jwt from 'jsonwebtoken';
import { supabaseAdmin, TABLES } from '../config/supabase.js';

// 存储用户连接
const userConnections = new Map();

// 验证 Socket 连接的 token
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从数据库获取用户信息
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, student_id, name, avatar_url, role, is_active')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return next(new Error('Invalid token or user not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// 设置 Socket.IO 处理器
export const setupSocketHandlers = (io) => {
  // 认证中间件
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User ${socket.user.name} (${userId}) connected`);

    // 存储用户连接
    userConnections.set(userId, socket);

    // 用户上线状态更新
    socket.broadcast.emit('user_online', {
      user_id: userId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar_url: socket.user.avatar_url
      }
    });

    // 加入订单房间
    socket.on('join_order', async (data) => {
      try {
        const { order_id } = data;

        // 验证用户是否有权限加入此订单房间
        const { data: order, error } = await supabaseAdmin
          .from(TABLES.ORDERS)
          .select('id, creator_id, accepter_id')
          .eq('id', order_id)
          .single();

        if (error || !order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        if (order.creator_id !== userId && order.accepter_id !== userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`order_${order_id}`);
        socket.emit('joined_order', { order_id });
        
        console.log(`User ${userId} joined order room: order_${order_id}`);
      } catch (error) {
        console.error('Join order error:', error);
        socket.emit('error', { message: 'Failed to join order room' });
      }
    });

    // 离开订单房间
    socket.on('leave_order', (data) => {
      const { order_id } = data;
      socket.leave(`order_${order_id}`);
      socket.emit('left_order', { order_id });
      console.log(`User ${userId} left order room: order_${order_id}`);
    });

    // 发送消息
    socket.on('send_message', async (data) => {
      try {
        const { order_id, content, message_type = 'text' } = data;

        // 验证订单权限
        const { data: order, error: orderError } = await supabaseAdmin
          .from(TABLES.ORDERS)
          .select('id, creator_id, accepter_id')
          .eq('id', order_id)
          .single();

        if (orderError || !order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        if (order.creator_id !== userId && order.accepter_id !== userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // 保存消息到数据库
        const { data: message, error } = await supabaseAdmin
          .from(TABLES.MESSAGES)
          .insert({
            order_id,
            sender_id: userId,
            content,
            message_type,
            created_at: new Date().toISOString()
          })
          .select(`
            *,
            sender:users!messages_sender_id_fkey(id, name, avatar_url)
          `)
          .single();

        if (error) {
          console.error('Save message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
          return;
        }

        // 向订单房间广播消息
        io.to(`order_${order_id}`).emit('new_message', message);

        // 向对方发送推送通知（如果对方不在线）
        const recipientId = order.creator_id === userId ? order.accepter_id : order.creator_id;
        if (recipientId && !userConnections.has(recipientId)) {
          // 这里可以集成推送通知服务
          console.log(`Send push notification to user ${recipientId} for new message`);
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 订单状态更新
    socket.on('order_status_update', async (data) => {
      try {
        const { order_id, status, notes } = data;

        // 验证订单权限
        const { data: order, error: orderError } = await supabaseAdmin
          .from(TABLES.ORDERS)
          .select('id, creator_id, accepter_id, status')
          .eq('id', order_id)
          .single();

        if (orderError || !order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        if (order.creator_id !== userId && order.accepter_id !== userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // 向订单房间广播状态更新
        io.to(`order_${order_id}`).emit('order_status_changed', {
          order_id,
          old_status: order.status,
          new_status: status,
          notes,
          updated_by: {
            id: socket.user.id,
            name: socket.user.name
          },
          updated_at: new Date().toISOString()
        });

      } catch (error) {
        console.error('Order status update error:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // 位置更新（配送员实时位置）
    socket.on('location_update', async (data) => {
      try {
        const { order_id, coordinates } = data;

        // 验证订单权限（只有接单者可以更新位置）
        const { data: order, error: orderError } = await supabaseAdmin
          .from(TABLES.ORDERS)
          .select('id, accepter_id, status')
          .eq('id', order_id)
          .single();

        if (orderError || !order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        if (order.accepter_id !== userId) {
          socket.emit('error', { message: 'Only order accepter can update location' });
          return;
        }

        // 只在配送过程中更新位置
        if (!['picking', 'delivering'].includes(order.status)) {
          return;
        }

        // 向订单房间广播位置更新
        socket.to(`order_${order_id}`).emit('location_update', {
          order_id,
          coordinates,
          updated_by: userId,
          updated_at: new Date().toISOString()
        });

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // 输入状态（正在输入）
    socket.on('typing_start', (data) => {
      const { order_id } = data;
      socket.to(`order_${order_id}`).emit('user_typing', {
        order_id,
        user_id: userId,
        user_name: socket.user.name
      });
    });

    socket.on('typing_stop', (data) => {
      const { order_id } = data;
      socket.to(`order_${order_id}`).emit('user_stop_typing', {
        order_id,
        user_id: userId
      });
    });

    // 连接断开处理
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} (${userId}) disconnected: ${reason}`);
      
      // 移除用户连接
      userConnections.delete(userId);

      // 广播用户下线状态
      socket.broadcast.emit('user_offline', {
        user_id: userId,
        user: {
          id: socket.user.id,
          name: socket.user.name,
          avatar_url: socket.user.avatar_url
        }
      });
    });

    // 错误处理
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // 定期清理断开的连接
  setInterval(() => {
    for (const [userId, socket] of userConnections.entries()) {
      if (socket.disconnected) {
        userConnections.delete(userId);
      }
    }
  }, 30000); // 每30秒清理一次
};

// 获取在线用户列表
export const getOnlineUsers = () => {
  return Array.from(userConnections.keys());
};

// 向特定用户发送消息
export const sendToUser = (userId, event, data) => {
  const socket = userConnections.get(userId);
  if (socket && !socket.disconnected) {
    socket.emit(event, data);
    return true;
  }
  return false;
};

// 向订单房间发送消息
export const sendToOrderRoom = (io, orderId, event, data) => {
  io.to(`order_${orderId}`).emit(event, data);
};