import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { orderAPI } from '../utils/api';

export interface Order {
  id: string;
  title: string;
  description: string;
  pickup_location: string;
  delivery_location: string;
  pickup_time: string;
  delivery_time?: string;
  fee: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  platform: 'meituan' | 'eleme' | 'other';
  creator_id: string;
  accepter_id?: string;
  creator: {
    id: string;
    name: string;
    avatar_url?: string;
    rating: number;
  };
  accepter?: {
    id: string;
    name: string;
    avatar_url?: string;
    rating: number;
  };
  images?: string[];
  created_at: string;
  updated_at: string;
}

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    status?: string
    platform?: string
    is_urgent?: boolean
    creator_id?: string
    accepter_id?: string
  }
}

interface OrderActions {
  // 获取订单列表
  fetchOrders: (params?: {
    page?: number
    limit?: number
    status?: string
    platform?: string
    is_urgent?: boolean
    creator_id?: string
    accepter_id?: string
    sort_by?: string
    sort_order?: string
  }) => Promise<void>
  
  // 获取单个订单详情
  fetchOrder: (orderId: string) => Promise<void>
  
  // 创建订单
  createOrder: (orderData: {
    pickup_platform: string
    pickup_location: any
    delivery_location: any
    base_fee: number
    urgent_fee?: number
    special_requirements?: string
    is_urgent?: boolean
    pickup_time?: string
  }) => Promise<Order>
  
  // 接受订单
  acceptOrder: (orderId: string) => Promise<void>
  
  // 更新订单状态
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  
  // 取消订单
  cancelOrder: (orderId: string) => Promise<void>
  
  // 获取用户订单统计
  fetchUserStats: (userId: string) => Promise<any>
  
  // 获取订单统计
  fetchOrderStats: () => Promise<any>
  
  // 设置过滤器
  setFilters: (filters: Partial<OrderState['filters']>) => void
  
  // 清除错误
  clearError: () => void
  
  // 设置加载状态
  setLoading: (loading: boolean) => void
  
  // 重置状态
  reset: () => void
  
  // Socket 事件处理
  handleNewOrder: (order: Order) => void
  handleOrderUpdate: (data: { orderId: string; status: string; order: Order }) => void
  handleOrderAccepted: (data: { orderId: string; order: Order }) => void
}

type OrderStore = OrderState & OrderActions

export const useOrderStore = create<OrderStore>((set, get) => ({
  // State
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  filters: {},

  // Actions
  fetchOrders: async (params = {}) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.getOrders(params)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const { orders, pagination } = response.data

      set({
        orders,
        pagination,
        isLoading: false,
        error: null
      })

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取订单列表失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  fetchOrder: async (orderId: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.getOrder(orderId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const order = response.data

      set({
        currentOrder: order,
        isLoading: false,
        error: null
      })

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取订单详情失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  createOrder: async (orderData) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.createOrder(orderData)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const order = response.data

      // 添加到订单列表
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
        error: null
      }))

      return order

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '创建订单失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.acceptOrder(orderId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const updatedOrder = response.data

      // 更新订单列表
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
        isLoading: false,
        error: null
      }))

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '接受订单失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.updateOrderStatus(orderId, status)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const updatedOrder = response.data

      // 更新订单列表
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
        isLoading: false,
        error: null
      }))

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '更新订单状态失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  cancelOrder: async (orderId: string) => {
    try {
      set({ isLoading: true, error: null })

      const response = await orderAPI.cancelOrder(orderId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // 从订单列表中移除
      set((state) => ({
        orders: state.orders.filter(order => order.id !== orderId),
        currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        isLoading: false,
        error: null
      }))

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '取消订单失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  fetchUserStats: async (userId: string) => {
    try {
      const response = await orderAPI.getUserStats(userId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      return response.data

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取用户统计失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  fetchOrderStats: async () => {
    try {
      const response = await orderAPI.getOrderStats()
      
      if (response.error) {
        throw new Error(response.error)
      }

      return response.data

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取订单统计失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  reset: () => {
    set({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      filters: {}
    })
  },

  // Socket 事件处理
  handleNewOrder: (order: Order) => {
    set((state) => ({
      orders: [order, ...state.orders]
    }))
  },

  handleOrderUpdate: (data: { orderId: string; status: string; order: Order }) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === data.orderId ? data.order : order
      ),
      currentOrder: state.currentOrder?.id === data.orderId ? data.order : state.currentOrder
    }))
  },

  handleOrderAccepted: (data: { orderId: string; order: Order }) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === data.orderId ? data.order : order
      ),
      currentOrder: state.currentOrder?.id === data.orderId ? data.order : state.currentOrder
    }))
  }
}))

// 设置 Socket 事件监听
const setupSocketListeners = () => {
  const socket = socketManager.getSocket()
  if (!socket) return

  const store = useOrderStore.getState()

  socket.on('new_order', store.handleNewOrder)
  socket.on('order_status_updated', store.handleOrderUpdate)
  socket.on('order_accepted', store.handleOrderAccepted)
}

// 清理 Socket 事件监听
const cleanupSocketListeners = () => {
  const socket = socketManager.getSocket()
  if (!socket) return

  socket.off('new_order')
  socket.off('order_status_updated')
  socket.off('order_accepted')
}

// 导出设置和清理函数
export { setupSocketListeners, cleanupSocketListeners }