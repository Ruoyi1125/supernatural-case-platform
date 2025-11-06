import { io, Socket } from 'socket.io-client';

// Socket.IO 客户端实例
let socket: Socket | null = null;

// Socket 事件类型
export interface SocketEvents {
  // 连接事件
  connect: () => void;
  disconnect: (reason: string) => void;
  
  // 用户状态事件
  user_online: (data: { user_id: string; user: any }) => void;
  user_offline: (data: { user_id: string; user: any }) => void;
  
  // 订单房间事件
  joined_order: (data: { order_id: string }) => void;
  left_order: (data: { order_id: string }) => void;
  
  // 消息事件
  new_message: (message: any) => void;
  message_deleted: (data: { message_id: string }) => void;
  
  // 订单状态事件
  order_status_changed: (data: {
    order_id: string;
    old_status: string;
    new_status: string;
    notes?: string;
    updated_by: any;
    updated_at: string;
  }) => void;
  
  // 位置更新事件
  location_update: (data: {
    order_id: string;
    coordinates: { lng: number; lat: number };
    updated_by: string;
    updated_at: string;
  }) => void;
  
  // 输入状态事件
  user_typing: (data: {
    order_id: string;
    user_id: string;
    user_name: string;
  }) => void;
  
  user_stop_typing: (data: {
    order_id: string;
    user_id: string;
  }) => void;
  
  // 错误事件
  error: (data: { message: string }) => void;
}

// 初始化 Socket 连接
export const initializeSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // 连接事件监听
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

// 获取当前 Socket 实例
export const getSocket = (): Socket | null => {
  return socket;
};

// 断开 Socket 连接
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket 事件监听器
export const socketListeners = {
  // 监听事件
  on: <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void => {
    socket?.on(event, callback);
  },

  // 移除事件监听
  off: <K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void => {
    if (callback) {
      socket?.off(event, callback);
    } else {
      socket?.off(event);
    }
  },

  // 发送事件
  emit: (event: string, data?: any): void => {
    socket?.emit(event, data);
  },
};

// 订单房间管理
export const orderRoom = {
  // 加入订单房间
  join: (orderId: string): void => {
    socket?.emit('join_order', { order_id: orderId });
  },

  // 离开订单房间
  leave: (orderId: string): void => {
    socket?.emit('leave_order', { order_id: orderId });
  },
};

// 消息功能
export const socketMessage = {
  // 发送消息
  send: (data: {
    order_id: string;
    content: string;
    message_type?: string;
  }): void => {
    socket?.emit('send_message', data);
  },

  // 开始输入
  startTyping: (orderId: string): void => {
    socket?.emit('typing_start', { order_id: orderId });
  },

  // 停止输入
  stopTyping: (orderId: string): void => {
    socket?.emit('typing_stop', { order_id: orderId });
  },
};

// 订单状态更新
export const socketOrder = {
  // 更新订单状态
  updateStatus: (data: {
    order_id: string;
    status: string;
    notes?: string;
  }): void => {
    socket?.emit('order_status_update', data);
  },

  // 更新位置
  updateLocation: (data: {
    order_id: string;
    coordinates: { lng: number; lat: number };
  }): void => {
    socket?.emit('location_update', data);
  },
};

// Socket 连接状态管理
export const socketStatus = {
  // 检查连接状态
  isConnected: (): boolean => {
    return socket?.connected || false;
  },

  // 获取连接 ID
  getId: (): string | undefined => {
    return socket?.id;
  },

  // 重新连接
  reconnect: (): void => {
    socket?.connect();
  },
};

// 自动重连管理
let reconnectTimer: NodeJS.Timeout | null = null;

export const autoReconnect = {
  // 开始自动重连
  start: (token: string, interval: number = 5000): void => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
    }

    reconnectTimer = setInterval(() => {
      if (!socketStatus.isConnected()) {
        console.log('Attempting to reconnect socket...');
        try {
          initializeSocket(token);
        } catch (error) {
          console.error('Auto reconnect failed:', error);
        }
      }
    }, interval);
  },

  // 停止自动重连
  stop: (): void => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  },
};

// 清理所有 Socket 相关资源
export const cleanupSocket = (): void => {
  autoReconnect.stop();
  disconnectSocket();
};

export default {
  initialize: initializeSocket,
  get: getSocket,
  disconnect: disconnectSocket,
  listeners: socketListeners,
  orderRoom,
  message: socketMessage,
  order: socketOrder,
  status: socketStatus,
  autoReconnect,
  cleanup: cleanupSocket,
};