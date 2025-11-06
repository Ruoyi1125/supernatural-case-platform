import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

class SocketManager {
  private socket: Socket | null = null
  private isConnected = false

  // 连接 Socket
  connect(userId: string) {
    if (this.socket && this.isConnected) {
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        userId,
        token: localStorage.getItem('auth_token'),
      },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
    })

    return this.socket
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // 获取当前 socket 实例
  getSocket() {
    return this.socket
  }

  // 检查连接状态
  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }

  // 加入订单房间
  joinOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_order', orderId)
    }
  }

  // 离开订单房间
  leaveOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_order', orderId)
    }
  }

  // 发送消息
  sendMessage(data: {
    orderId: string
    content: string
    messageType?: 'text' | 'image'
    imageUrl?: string
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', data)
    }
  }

  // 更新订单状态
  updateOrderStatus(data: { orderId: string; status: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('order_status_update', data)
    }
  }

  // 监听新消息
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback)
    }
  }

  // 监听订单状态更新
  onOrderStatusUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('order_status_updated', callback)
    }
  }

  // 监听新订单通知
  onNewOrder(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('new_order', callback)
    }
  }

  // 监听订单被接受
  onOrderAccepted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('order_accepted', callback)
    }
  }

  // 移除事件监听器
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // 移除所有事件监听器
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

// 创建单例实例
const socketManager = new SocketManager()

export default socketManager

// 导出类型定义
export interface SocketMessage {
  id: string
  orderId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'system'
  imageUrl?: string
  createdAt: string
  sender: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface SocketOrderUpdate {
  orderId: string
  status: string
  updatedBy: string
  updatedAt: string
}

export interface SocketNewOrder {
  id: string
  creatorId: string
  pickupPlatform: string
  pickupLocation: {
    name: string
    address: string
    latitude: number
    longitude: number
  }
  deliveryLocation: {
    name: string
    address: string
    latitude: number
    longitude: number
  }
  baseFee: number
  urgentFee?: number
  totalFee: number
  isUrgent: boolean
  specialRequirements?: string
  createdAt: string
  creator: {
    id: string
    name: string
    avatar_url?: string
    dormitory_area: string
    building_number?: string
  }
}