import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { messageAPI } from '../utils/api';
import { socketMessage, socketListeners } from '../utils/socket';

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'image' | 'system';
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  order_id: string;
  other_user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  last_message: Message;
  unread_count: number;
  order_title: string;
}

interface MessageState {
  messages: Message[]
  conversations: Array<{
    order_id: string
    order_title: string
    other_user: {
      id: string
      name: string
      avatar_url?: string
    }
    last_message: Message
    unread_count: number
  }>
  currentOrderId: string | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface MessageActions {
  // 获取订单消息列表
  getMessages: (orderId: string, params?: {
    page?: number
    limit?: number
  }) => Promise<void>
  
  // 发送消息
  sendMessage: (orderId: string, content: string, messageType?: string, images?: File[]) => Promise<Message>
  
  // 获取对话列表
  getConversations: () => Promise<void>
  
  // 获取单个对话
  getConversationById: (orderId: string) => Promise<any>
  
  // 标记消息为已读
  markAsRead: (orderId: string) => Promise<void>
  
  // 删除消息
  deleteMessage: (messageId: string) => Promise<void>
  
  // 设置当前订单ID
  setCurrentOrderId: (orderId: string | null) => void
  
  // 清除错误
  clearError: () => void
  
  // 设置加载状态
  setLoading: (loading: boolean) => void
  
  // 重置状态
  reset: () => void
  
  // Socket 事件处理
  handleNewMessage: (message: Message) => void
  handleMessageRead: (data: { orderId: string; userId: string }) => void
  handleUserTyping: (data: { orderId: string; userId: string; isTyping: boolean }) => void
}

type MessageStore = MessageState & MessageActions

export const useMessageStore = create<MessageStore>((set, get) => ({
  // State
  messages: [],
  conversations: [],
  currentOrderId: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  },

  // Actions
  getMessages: async (orderId: string, params = {}) => {
    try {
      set({ isLoading: true, error: null, currentOrderId: orderId })

      const response = await messageAPI.getMessages(orderId, params)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const { messages, pagination } = response.data

      set({
        messages,
        pagination,
        isLoading: false,
        error: null
      })

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取消息列表失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  sendMessage: async (orderId: string, content: string, messageType = 'text', images?: File[]) => {
    try {
      let messageData: any = {
        order_id: orderId,
        content,
        message_type: messageType
      }

      // 如果有图片，先上传图片
      if (images && images.length > 0) {
        const formData = new FormData()
        images.forEach((image, index) => {
          formData.append('images', image)
        })
        formData.append('order_id', orderId)
        formData.append('message_type', 'image')

        const response = await messageAPI.sendMessage(formData)
        
        if (response.error) {
          throw new Error(response.error)
        }

        const message = response.data

        // 添加到消息列表
        set((state) => ({
          messages: [...state.messages, message]
        }))

        // 通过 Socket 发送消息通知
        socketMessage.send({
          order_id: orderId,
          content: message.content,
          message_type: 'image'
        })

        return message
      } else {
        // 发送文本消息
        const response = await messageAPI.sendMessage(messageData)
        
        if (response.error) {
          throw new Error(response.error)
        }

        const message = response.data

        // 添加到消息列表
        set((state) => ({
          messages: [...state.messages, message]
        }))

        // 通过 Socket 发送消息
        socketMessage.send({
          order_id: orderId,
          content,
          message_type: messageType
        })

        return message
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '发送消息失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  getConversations: async () => {
    try {
      set({ isLoading: true, error: null })

      const response = await messageAPI.getConversations()
      
      if (response.error) {
        throw new Error(response.error)
      }

      const conversations = response.data

      set({
        conversations,
        isLoading: false,
        error: null
      })

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取对话列表失败'
      set({
        isLoading: false,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  },

  getConversationById: async (orderId: string) => {
    try {
      const response = await messageAPI.getConversationById(orderId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      return response.data

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '获取对话失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  markAsRead: async (orderId: string) => {
    try {
      const response = await messageAPI.markAsRead(orderId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // 更新对话列表中的未读数
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.order_id === orderId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      }))

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '标记已读失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const response = await messageAPI.deleteMessage(messageId)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // 从消息列表中移除
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== messageId)
      }))

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '删除消息失败'
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  setCurrentOrderId: (orderId: string | null) => {
    set({ currentOrderId: orderId })
  },

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  reset: () => {
    set({
      messages: [],
      conversations: [],
      currentOrderId: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    })
  },

  handleNewMessage: (message: Message) => {
    set((state) => {
      // 如果是当前订单的消息，添加到消息列表
      if (state.currentOrderId === message.order_id) {
        return {
          messages: [...state.messages, message]
        }
      }
      
      // 更新对话列表
      const updatedConversations = state.conversations.map(conv => {
        if (conv.order_id === message.order_id) {
          return {
            ...conv,
            last_message: message,
            unread_count: conv.unread_count + 1
          }
        }
        return conv
      })

      return {
        conversations: updatedConversations
      }
    })
  },

  handleMessageRead: (data: { orderId: string; userId: string }) => {
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.order_id === data.orderId
          ? { ...conv, unread_count: 0 }
          : conv
      )
    }))
  },

  handleUserTyping: (data: { orderId: string; userId: string; isTyping: boolean }) => {
    // 可以在这里处理用户输入状态的显示
    console.log('User typing:', data)
  }
}))

// 初始化 Socket 事件监听
export const initializeMessageSocket = () => {
  const store = useMessageStore.getState()

  // 监听新消息
  socketListeners.on('new_message', store.handleNewMessage)
  
  // 监听消息已读
  socketListeners.on('message_read', store.handleMessageRead)
  
  // 监听用户输入状态
  socketListeners.on('user_typing', store.handleUserTyping)
}

// 清理 Socket 事件监听
export const cleanupMessageSocket = () => {
  socketListeners.off('new_message')
  socketListeners.off('message_read')
  socketListeners.off('user_typing')
}