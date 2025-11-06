import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search, Clock, User, Package } from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useMessageStore } from '../stores/messageStore'
import { useAuthStore } from '../stores/authStore'
import { type Order } from '../lib/supabase'

interface ConversationItem {
  order: Order
  lastMessage?: {
    content: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
}

const MessageCenter: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const { 
    orders, 
    fetchOrders, 
    error: orderError, 
    clearError: clearOrderError 
  } = useOrderStore()
  const { 
    getMessages, 
    error: messageError, 
    clearError: clearMessageError 
  } = useMessageStore()
  const { user } = useAuthStore()

  // 清除错误
  useEffect(() => {
    if (orderError) {
      const timer = setTimeout(() => {
        clearOrderError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [orderError, clearOrderError])

  useEffect(() => {
    if (messageError) {
      const timer = setTimeout(() => {
        clearMessageError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [messageError, clearMessageError])

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return

      setLoading(true)
      try {
        // 获取用户参与的所有订单（作为发单人或接单人）
        await fetchOrders()
        
        // 过滤出用户参与的订单
        const userOrders = orders.filter(order => 
          (order.creator_id === user.id || order.accepter_id === user.id) &&
          order.status !== 'pending' // 排除待接单的订单
        )

        // 为每个订单获取最后一条消息
        const conversationPromises = userOrders.map(async (order) => {
          try {
            const orderMessages = await getMessages(order.id)
            const lastMessage = orderMessages && orderMessages.length > 0 
              ? orderMessages[orderMessages.length - 1] 
              : undefined
            const unreadCount = orderMessages 
              ? orderMessages.filter(msg => !msg.is_read && msg.sender_id !== user.id).length 
              : 0

            return {
              order,
              lastMessage,
              unreadCount
            }
          } catch (error) {
            console.error(`获取订单 ${order.id} 的消息失败:`, error)
            return {
              order,
              lastMessage: undefined,
              unreadCount: 0
            }
          }
        })

        const conversationData = await Promise.all(conversationPromises)
        
        // 按最后消息时间排序
        conversationData.sort((a, b) => {
          const timeA = a.lastMessage 
            ? new Date(a.lastMessage.created_at).getTime() 
            : new Date(a.order.created_at).getTime()
          const timeB = b.lastMessage 
            ? new Date(b.lastMessage.created_at).getTime() 
            : new Date(b.order.created_at).getTime()
          return timeB - timeA
        })

        setConversations(conversationData)
      } catch (error) {
        console.error('加载对话列表失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user, orders, fetchOrders, getMessages])

  // 过滤对话
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true
    
    const order = conversation.order
    const searchLower = searchQuery.toLowerCase()
    
    return (
      order.pickup_platform?.toLowerCase().includes(searchLower) ||
      order.pickup_location?.name?.toLowerCase().includes(searchLower) ||
      order.delivery_location?.address?.toLowerCase().includes(searchLower) ||
      order.creator?.name?.toLowerCase().includes(searchLower) ||
      order.accepter?.name?.toLowerCase().includes(searchLower)
    )
  })

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
    
    const diffInDays = Math.floor(diffInMinutes / 1440)
    if (diffInDays < 7) return `${diffInDays}天前`
    
    return date.toLocaleDateString()
  }

  const getOtherUser = (order: Order) => {
    if (!user) return null
    return order.creator_id === user.id ? order.accepter : order.creator
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'picking': return 'bg-orange-100 text-orange-800'
      case 'delivering': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return '已接单'
      case 'picking': return '取餐中'
      case 'delivering': return '配送中'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">请先登录</h3>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 错误提示 */}
      {(orderError || messageError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{orderError || messageError}</span>
            <button
              onClick={() => {
                if (orderError) clearOrderError()
                if (messageError) clearMessageError()
              }}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-blue-600">消息中心</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredConversations.length} 个对话
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无对话</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? '没有找到符合条件的对话' : '当您参与订单后，对话将出现在这里'}
            </p>
            {!searchQuery && (
              <Link
                to="/order-hall"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                去接单
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation.order)
              const isCreator = conversation.order.creator_id === user.id
              
              return (
                <Link
                  key={conversation.order.id}
                  to={`/chat/${conversation.order.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* 对话内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 用户名和时间 */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {otherUser?.name || '未知用户'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            ({isCreator ? '接单人' : '发单人'})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage 
                              ? formatTime(conversation.lastMessage.created_at)
                              : formatTime(conversation.order.created_at)
                            }
                          </span>
                        </div>
                      </div>

                      {/* 订单信息 */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {conversation.order.pickup_platform}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.order.status)}`}>
                          {getStatusText(conversation.order.status)}
                        </span>
                      </div>

                      {/* 路线信息 */}
                      <div className="text-sm text-gray-600 mb-2">
                        {conversation.order.pickup_location?.name} → {conversation.order.delivery_location?.address}
                      </div>

                      {/* 最后一条消息 */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.sender_id === user.id && (
                                <span className="text-blue-600">我: </span>
                              )}
                              {conversation.lastMessage.content}
                            </>
                          ) : (
                            <span className="text-gray-400">暂无消息</span>
                          )}
                        </p>
                        <div className="text-sm font-medium text-blue-600">
                          ¥{conversation.order.base_fee + (conversation.order.urgent_fee || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageCenter