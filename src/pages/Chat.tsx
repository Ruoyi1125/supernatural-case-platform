import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, User, Package, MapPin, Clock, Phone } from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useMessageStore } from '../stores/messageStore'
import { useAuthStore } from '../stores/authStore'
import { type Order, type Message } from '../lib/supabase'
import { toast } from 'sonner'

const Chat: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [order, setOrder] = useState<Order | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const { getOrderById, error: orderError, clearError: clearOrderError } = useOrderStore()
  const { 
    getMessages,
    sendMessage,
    markAsRead,
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
    const loadChatData = async () => {
      if (!orderId || !user) return

      setLoading(true)
      try {
        // 获取订单信息
        const orderData = await getOrderById(orderId)
        if (!orderData) {
          toast.error('订单不存在')
          navigate('/messages')
          return
        }

        // 检查用户是否有权限查看此对话
        if (orderData.creator_id !== user.id && orderData.accepter_id !== user.id) {
          toast.error('您没有权限查看此对话')
          navigate('/messages')
          return
        }

        setOrder(orderData)

        // 获取消息
        const messagesData = await getMessages(orderId)
        setMessages(messagesData || [])

        // 标记消息为已读
        await markAsRead(orderId)
      } catch (error) {
        console.error('加载聊天数据失败:', error)
        toast.error('加载聊天数据失败')
      } finally {
        setLoading(false)
      }
    }

    loadChatData()
  }, [orderId, user, getOrderById, getMessages, markAsRead, navigate])

  // 滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !orderId || !user || sending) return

    setSending(true)
    try {
      await sendMessage(orderId, newMessage.trim(), 'text')
      setNewMessage('')
      
      // 重新获取消息列表
      const updatedMessages = await getMessages(orderId)
      setMessages(updatedMessages || [])
    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败')
    } finally {
      setSending(false)
    }
  }

  const getOtherUser = () => {
    if (!order || !user) return null
    return order.creator_id === user.id ? order.accepter : order.creator
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    if (diffInMinutes < 1440) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">订单不存在</h3>
          <button
            onClick={() => navigate('/messages')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回消息中心
          </button>
        </div>
      </div>
    )
  }

  const otherUser = getOtherUser()
  const isCreator = order.creator_id === user.id

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/messages')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    {otherUser?.name || '未知用户'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isCreator ? '接单人' : '发单人'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/order/${order.id}`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="查看订单详情"
              >
                <Package className="w-5 h-5" />
              </Link>
              {otherUser?.phone && (
                <a
                  href={`tel:${otherUser.phone}`}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="拨打电话"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 订单信息卡片 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {order.pickup_platform}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{order.pickup_location?.name} → {order.delivery_location?.address}</span>
              </div>
            </div>
            <div className="text-lg font-bold text-blue-600">
              ¥{order.base_fee + (order.urgent_fee || 0)}
            </div>
          </div>
          {order.expected_pickup_time && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 mt-2">
              <Clock className="w-4 h-4" />
              <span>期望取餐时间: {new Date(order.expected_pickup_time).toLocaleString('zh-CN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">开始对话</h3>
              <p className="text-gray-600">
                发送第一条消息开始与{isCreator ? '接单人' : '发单人'}的对话
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMyMessage = message.sender_id === user.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900 border'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isMyMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 消息输入框 */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending || order.status === 'cancelled'}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || order.status === 'cancelled'}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          {order.status === 'cancelled' && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              订单已取消，无法发送消息
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat