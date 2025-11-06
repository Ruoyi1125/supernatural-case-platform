import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle, User, Clock, Package } from 'lucide-react'
import { useMessageStore } from '../stores/messageStore'
import { useAuthStore } from '../stores/authStore'
import { formatTime } from '../utils'

const Messages: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    conversations, 
    getConversations, 
    markAsRead,
    isLoading,
    error,
    clearError 
  } = useMessageStore()
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filteredConversations, setFilteredConversations] = useState(conversations)

  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id])

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  useEffect(() => {
    // 搜索过滤
    if (searchKeyword.trim()) {
      const filtered = conversations.filter(conversation => {
        const otherUser = conversation.other_user
        return otherUser?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
               otherUser?.student_id?.includes(searchKeyword)
      })
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [conversations, searchKeyword])

  const loadConversations = async () => {
    try {
      await getConversations()
    } catch (err) {
      console.error('加载对话列表失败:', err)
    }
  }

  const handleConversationClick = async (conversationId: string, hasUnread: boolean) => {
    // 如果有未读消息，标记为已读
    if (hasUnread) {
      try {
        await markAsRead(conversationId)
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
    
    navigate(`/messages/${conversationId}`)
  }

  const getLastMessagePreview = (message: any) => {
    if (!message) return '暂无消息'
    
    if (message.message_type === 'text') {
      return message.content
    } else if (message.message_type === 'image') {
      return '[图片]'
    } else if (message.message_type === 'system') {
      return message.content
    }
    
    return '未知消息类型'
  }

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="搜索联系人..."
            />
          </div>
          
          {getTotalUnreadCount() > 0 && (
            <div className="mt-3 text-sm text-blue-600">
              {getTotalUnreadCount()} 条未读消息
            </div>
          )}
        </div>
      </div>

      {/* 对话列表 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchKeyword ? '没有找到相关对话' : '暂无对话'}
            </p>
            <p className="text-gray-400 mt-2">
              {searchKeyword ? '尝试其他关键词' : '开始接单或发单来与其他用户聊天'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.other_user
              const lastMessage = conversation.last_message
              const hasUnread = (conversation.unread_count || 0) > 0
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id, hasUnread)}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    hasUnread ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* 头像 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {otherUser?.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt="头像"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 对话信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-medium truncate ${
                            hasUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {otherUser?.name || '未知用户'}
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {otherUser?.student_id}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {lastMessage && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(lastMessage.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 最后一条消息 */}
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {getLastMessagePreview(lastMessage)}
                        </p>
                        
                        {/* 订单信息 */}
                        {conversation.order && (
                          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2 flex-shrink-0">
                            <Package className="w-3 h-3 mr-1" />
                            <span>订单</span>
                          </div>
                        )}
                      </div>

                      {/* 订单详情 */}
                      {conversation.order && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>
                              ¥{conversation.order.base_fee + (conversation.order.urgent_fee || 0)}
                            </span>
                            <span className="truncate">
                              {conversation.order.pickup_location?.name || '取餐地址'} → {conversation.order.delivery_location?.address || '送达地址'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages