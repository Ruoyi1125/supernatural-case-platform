import express from 'express';
import { supabaseAdmin, TABLES, ORDER_STATUS, PLATFORM_TYPE } from '../config/supabase.js';
import { 
  validate, 
  validateOrderStatus, 
  validatePlatform,
  validateFee,
  validateCoordinates 
} from '../utils/validation.js';

const router = express.Router();

// 创建订单验证规则
const createOrderValidation = {
  platform: {
    required: true,
    type: 'string',
    validator: validatePlatform,
    message: 'Invalid platform type'
  },
  restaurant_name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  delivery_fee: {
    required: true,
    type: 'number',
    validator: validateFee,
    message: 'Delivery fee must be between 0 and 100'
  },
  pickup_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  delivery_location: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  pickup_coordinates: {
    required: false,
    type: 'object',
    validator: validateCoordinates,
    message: 'Invalid coordinates format'
  },
  delivery_coordinates: {
    required: false,
    type: 'object',
    validator: validateCoordinates,
    message: 'Invalid coordinates format'
  },
  notes: {
    required: false,
    type: 'string',
    maxLength: 500
  },
  expected_delivery_time: {
    required: false,
    type: 'string'
  }
};

// 更新订单状态验证规则
const updateStatusValidation = {
  status: {
    required: true,
    type: 'string',
    validator: validateOrderStatus,
    message: 'Invalid order status'
  },
  notes: {
    required: false,
    type: 'string',
    maxLength: 500
  }
};

// 创建订单
router.post('/', validate(createOrderValidation), async (req, res) => {
  try {
    const {
      platform,
      restaurant_name,
      delivery_fee,
      pickup_location,
      delivery_location,
      pickup_coordinates,
      delivery_coordinates,
      notes,
      expected_delivery_time
    } = req.body;

    const orderData = {
      creator_id: req.user.id,
      platform,
      restaurant_name,
      delivery_fee: parseFloat(delivery_fee),
      pickup_location,
      delivery_location,
      pickup_coordinates: pickup_coordinates ? JSON.stringify(pickup_coordinates) : null,
      delivery_coordinates: delivery_coordinates ? JSON.stringify(delivery_coordinates) : null,
      notes: notes || null,
      expected_delivery_time: expected_delivery_time || null,
      status: ORDER_STATUS.PENDING,
      total_fee: parseFloat(delivery_fee),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .insert(orderData)
      .select(`
        *,
        creator:users!orders_creator_id_fkey(id, name, avatar_url, rating),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url, rating)
      `)
      .single();

    if (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 获取订单列表
router.get('/', async (req, res) => {
  try {
    const {
      status,
      platform,
      my_orders,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from(TABLES.ORDERS)
      .select(`
        *,
        creator:users!orders_creator_id_fkey(id, name, avatar_url, rating),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url, rating)
      `);

    // 筛选条件
    if (status) {
      query = query.eq('status', status);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (my_orders === 'true') {
      query = query.or(`creator_id.eq.${req.user.id},accepter_id.eq.${req.user.id}`);
    }

    // 排序
    const validSortFields = ['created_at', 'updated_at', 'delivery_fee', 'expected_delivery_time'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const ascending = sort_order === 'asc';

    query = query.order(sortField, { ascending });

    // 分页
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    query = query.range(offset, offset + limitNum - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Get orders error:', error);
      return res.status(500).json({ error: 'Failed to get orders' });
    }

    // 处理坐标数据
    const processedOrders = orders.map(order => ({
      ...order,
      pickup_coordinates: order.pickup_coordinates ? JSON.parse(order.pickup_coordinates) : null,
      delivery_coordinates: order.delivery_coordinates ? JSON.parse(order.delivery_coordinates) : null
    }));

    res.json({
      orders: processedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        total_pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// 获取订单详情
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select(`
        *,
        creator:users!orders_creator_id_fkey(id, name, avatar_url, rating, phone),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url, rating, phone),
        order_images(id, image_url, uploaded_at)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户权限（只有订单创建者、接受者或管理员可以查看详情）
    const isAuthorized = order.creator_id === req.user.id || 
                        order.accepter_id === req.user.id || 
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 处理坐标数据
    const processedOrder = {
      ...order,
      pickup_coordinates: order.pickup_coordinates ? JSON.parse(order.pickup_coordinates) : null,
      delivery_coordinates: order.delivery_coordinates ? JSON.parse(order.delivery_coordinates) : null
    };

    res.json({ order: processedOrder });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// 接受订单
router.post('/:orderId/accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // 检查订单是否存在且状态为待接单
    const { data: order, error: fetchError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.creator_id === userId) {
      return res.status(400).json({ error: 'Cannot accept your own order' });
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return res.status(400).json({ error: 'Order is not available for acceptance' });
    }

    // 更新订单状态
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .update({
        accepter_id: userId,
        status: ORDER_STATUS.ACCEPTED,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('status', ORDER_STATUS.PENDING) // 防止并发接单
      .select(`
        *,
        creator:users!orders_creator_id_fkey(id, name, avatar_url, rating),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url, rating)
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(409).json({ error: 'Order has already been accepted' });
      }
      console.error('Accept order error:', updateError);
      return res.status(500).json({ error: 'Failed to accept order' });
    }

    res.json({
      message: 'Order accepted successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// 更新订单状态
router.put('/:orderId/status', validate(updateStatusValidation), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // 获取当前订单信息
    const { data: order, error: fetchError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查权限
    const isCreator = order.creator_id === userId;
    const isAccepter = order.accepter_id === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAccepter && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 验证状态转换
    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PICKING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PICKING]: [ORDER_STATUS.DELIVERING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.DELIVERING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.COMPLETED]: [],
      [ORDER_STATUS.CANCELLED]: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // 检查特定状态的权限
    if (status === ORDER_STATUS.CANCELLED) {
      // 只有创建者或接受者可以取消订单
      if (!isCreator && !isAccepter && !isAdmin) {
        return res.status(403).json({ error: 'Only order creator or accepter can cancel the order' });
      }
    } else {
      // 其他状态更新只有接受者可以操作
      if (!isAccepter && !isAdmin) {
        return res.status(403).json({ error: 'Only order accepter can update order status' });
      }
    }

    // 准备更新数据
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.status_notes = notes;
    }

    // 根据状态添加时间戳
    switch (status) {
      case ORDER_STATUS.PICKING:
        updateData.picked_up_at = new Date().toISOString();
        break;
      case ORDER_STATUS.DELIVERING:
        updateData.delivering_at = new Date().toISOString();
        break;
      case ORDER_STATUS.COMPLETED:
        updateData.completed_at = new Date().toISOString();
        break;
      case ORDER_STATUS.CANCELLED:
        updateData.cancelled_at = new Date().toISOString();
        break;
    }

    // 更新订单
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        creator:users!orders_creator_id_fkey(id, name, avatar_url, rating),
        accepter:users!orders_accepter_id_fkey(id, name, avatar_url, rating)
      `)
      .single();

    if (updateError) {
      console.error('Update order status error:', updateError);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    // 如果订单完成，更新用户完成订单数
    if (status === ORDER_STATUS.COMPLETED && order.accepter_id) {
      await supabaseAdmin
        .from(TABLES.USERS)
        .update({
          completed_orders: supabaseAdmin.raw('completed_orders + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.accepter_id);
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 删除订单（仅创建者可删除待接单的订单）
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // 检查订单是否存在
    const { data: order, error: fetchError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查权限
    if (order.creator_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only order creator can delete the order' });
    }

    // 只能删除待接单的订单
    if (order.status !== ORDER_STATUS.PENDING) {
      return res.status(400).json({ error: 'Can only delete pending orders' });
    }

    // 删除订单
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Delete order error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete order' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// 获取订单统计
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('status, platform, delivery_fee, created_at');

    if (error) {
      console.error('Get order stats error:', error);
      return res.status(500).json({ error: 'Failed to get order statistics' });
    }

    const stats = {
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
      active_orders: orders.filter(o => 
        [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PICKING, ORDER_STATUS.DELIVERING].includes(o.status)
      ).length,
      completed_orders: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
      cancelled_orders: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
      platform_stats: {},
      total_volume: orders
        .filter(o => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + parseFloat(o.delivery_fee || 0), 0)
    };

    // 平台统计
    Object.values(PLATFORM_TYPE).forEach(platform => {
      stats.platform_stats[platform] = orders.filter(o => o.platform === platform).length;
    });

    res.json({ stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to get order statistics' });
  }
});

export default router;