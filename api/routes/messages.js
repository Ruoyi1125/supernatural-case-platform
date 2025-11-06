import express from 'express';
import { supabaseAdmin, TABLES, MESSAGE_TYPE } from '../config/supabase.js';
import { validate } from '../utils/validation.js';

const router = express.Router();

// 发送消息验证规则
const sendMessageValidation = {
  order_id: {
    required: true,
    type: 'string',
    minLength: 1
  },
  content: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 1000
  },
  message_type: {
    required: false,
    type: 'string',
    enum: Object.values(MESSAGE_TYPE)
  }
};

// 发送消息
router.post('/', validate(sendMessageValidation), async (req, res) => {
  try {
    const { order_id, content, message_type = MESSAGE_TYPE.TEXT } = req.body;
    const userId = req.user.id;

    // 检查订单是否存在且用户有权限
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户是否是订单的参与者
    if (order.creator_id !== userId && order.accepter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 创建消息
    const messageData = {
      order_id,
      sender_id: userId,
      content,
      message_type,
      created_at: new Date().toISOString()
    };

    const { data: message, error } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .insert(messageData)
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // 通过 Socket.IO 实时发送消息（在 server.js 中处理）
    req.app.get('io').to(`order_${order_id}`).emit('new_message', message);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 获取订单消息列表
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // 检查订单是否存在且用户有权限
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户是否是订单的参与者
    if (order.creator_id !== userId && order.accepter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // 获取消息列表
    const { data: messages, error, count } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, avatar_url)
      `, { count: 'exact' })
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({ error: 'Failed to get messages' });
    }

    res.json({
      messages: messages.reverse(), // 反转以获得正确的时间顺序
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        total_pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// 获取用户的所有对话列表
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户参与的所有订单
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select(`
        id,
        creator_id,
        accepter_id,
        restaurant_name,
        status,
        created_at,
        creator:users!orders_creator_id_fkey(id, name, avatar_url),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url)
      `)
      .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`)
      .not('accepter_id', 'is', null) // 只显示已被接单的订单
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Get conversations error:', ordersError);
      return res.status(500).json({ error: 'Failed to get conversations' });
    }

    // 为每个订单获取最新消息
    const conversations = await Promise.all(
      orders.map(async (order) => {
        const { data: lastMessage } = await supabaseAdmin
          .from(TABLES.MESSAGES)
          .select(`
            id,
            content,
            message_type,
            created_at,
            sender:users!messages_sender_id_fkey(id, name)
          `)
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // 获取未读消息数
        const { count: unreadCount } = await supabaseAdmin
          .from(TABLES.MESSAGES)
          .select('id', { count: 'exact' })
          .eq('order_id', order.id)
          .neq('sender_id', userId)
          .eq('is_read', false);

        // 确定对话对象
        const otherUser = order.creator_id === userId ? order.accepter : order.creator;

        return {
          order_id: order.id,
          restaurant_name: order.pickup_location?.name || order.pickup_platform || '未知餐厅',
          order_status: order.status,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          updated_at: lastMessage?.created_at || order.created_at
        };
      })
    );

    // 按最后消息时间排序
    conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// 标记消息为已读
router.put('/order/:orderId/read', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // 检查订单是否存在且用户有权限
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户是否是订单的参与者
    if (order.creator_id !== userId && order.accepter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 标记所有非当前用户发送的消息为已读
    const { error } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark messages as read error:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// 删除消息（仅发送者可删除）
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // 检查消息是否存在
    const { data: message, error: fetchError } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .select('id, sender_id, order_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 检查权限
    if (message.sender_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only message sender can delete the message' });
    }

    // 软删除消息（标记为已删除而不是真正删除）
    const { error } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error('Delete message error:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }

    // 通过 Socket.IO 通知消息删除
    req.app.get('io').to(`order_${message.order_id}`).emit('message_deleted', {
      message_id: messageId
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// 获取未读消息总数
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户参与的所有订单ID
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id')
      .or(`creator_id.eq.${userId},accepter_id.eq.${userId}`);

    if (ordersError) {
      console.error('Get unread count error:', ordersError);
      return res.status(500).json({ error: 'Failed to get unread count' });
    }

    const orderIds = orders.map(order => order.id);

    if (orderIds.length === 0) {
      return res.json({ unread_count: 0 });
    }

    // 获取未读消息总数
    const { count, error } = await supabaseAdmin
      .from(TABLES.MESSAGES)
      .select('id', { count: 'exact' })
      .in('order_id', orderIds)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .eq('is_deleted', false);

    if (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({ error: 'Failed to get unread count' });
    }

    res.json({ unread_count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;