import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  MessageCircle, 
  Phone,
  Star,
  AlertCircle
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useMessageStore } from '../stores/messageStore'
import { formatTime, formatPrice, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PLATFORM_MAP, PLATFORM_COLORS } from '../utils'

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { 
    currentOrder, 
    getOrderById, 
    acceptOrder, 
    updateOrderStatus, 
    cancelOrder, 
    rateOrder,
    isLoading, 
    error,
    clearError 
  } = useOrderStore()
  
  const { user } = useAuthStore()
  const { createConversation } = useMessageStore()
  
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [rating, setRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')

  useEffect(() => {
    if (id) {
      loadOrderDetail()
    }
  }, [id])

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const loadOrderDetail = async () => {
    if (!id) return
    
    try {
      await getOrderById(id)
    } catch (err) {
      console.error('加载订单详情失败:', err)
    }
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">订单不存在</p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回订单列表
            </button>
          </div>
        )}
      </div>
    )
  }

  // 权限判断
  const isOwner = user?.id === currentOrder.user_id
  const isDeliverer = user?.id === currentOrder.deliverer_id
  
  // 操作权限
  const canAccept = currentOrder.status === 'pending' && !isOwner && !isDeliverer
  const canCancel = (isOwner && ['pending', 'accepted'].includes(currentOrder.status)) || 
                   (isDeliverer && currentOrder.status === 'accepted')
  const canUpdateStatus = isDeliverer && ['accepted', 'picking', 'delivering'].includes(currentOrder.status)
  const canRate = currentOrder.status === 'completed' && !currentOrder.rating && (isOwner || isDeliverer)

  // 获取下一个状态
  const getNextStatus = () => {
    switch (currentOrder.status) {
      case 'accepted':
        return 'picking'
      case 'picking':
        return 'delivering'
      case 'delivering':
        return 'completed'
      default:
        return null
    }
  }

  // 获取下一个状态的文本
  const getNextStatusText = () => {
    switch (currentOrder.status) {
      case 'accepted':
        return '开始取餐'
      case 'picking':
        return '开始配送'
      case 'delivering':
        return '完成订单'
      default:
        return ''
    }
  }

  // 处理接单
  const handleAcceptOrder = async () => {
    if (!id) return
    
    try {
      await acceptOrder(id)
      await loadOrderDetail() // 重新加载订单详情
    } catch (err) {
      console.error('接单失败:', err)
    }
  }

  // 处理状态更新
  const handleUpdateStatus = async (status: string) => {
    if (!id) return
    
    try {
      await updateOrderStatus(id, status)
      await loadOrderDetail() // 重新加载订单详情
    } catch (err) {
      console.error('更新状态失败:', err)
    }
  }

  // 处理取消订单
  const handleCancelOrder = async () => {
    if (!id || !cancelReason.trim()) return
    
    try {
      await cancelOrder(id, cancelReason)
      setShowCancelModal(false)
      setCancelReason('')
      await loadOrderDetail() // 重新加载订单详情
    } catch (err) {
      console.error('取消订单失败:', err)
    }
  }

  // 处理评价
  const handleRateOrder = async () => {
    if (!id) return
    
    try {
      await rateOrder(id, rating, ratingComment)
      setShowRatingModal(false)
      setRating(5)
      setRatingComment('')
      await loadOrderDetail() // 重新加载订单详情
    } catch (err) {
      console.error('评价失败:', err)
    }
  }

  // 开始聊天
  const handleStartChat = async () => {
    if (!currentOrder) return
    
    try {
      let targetUserId: string
      
      if (isOwner && currentOrder.deliverer_id) {
        targetUserId = currentOrder.deliverer_id
      } else if (isDeliverer) {
        targetUserId = currentOrder.user_id
      } else {
        return
      }
      
      const conversation = await createConversation(targetUserId, currentOrder.id)
      navigate(`/messages/${conversation.id}`)
    } catch (err) {
      console.error('创建会话失败:', err)
    }
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

      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">订单详情</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 订单基本信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[currentOrder.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                  {ORDER_STATUS_MAP[currentOrder.status as keyof typeof ORDER_STATUS_MAP]}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${PLATFORM_COLORS[currentOrder.pickup_platform as keyof typeof PLATFORM_COLORS]}`}>
                  {PLATFORM_MAP[currentOrder.pickup_platform as keyof typeof PLATFORM_MAP]}
                </span>
                {currentOrder.is_urgent && (
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                    急单
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">订单号：{currentOrder.id}</p>
              <p className="text-sm text-gray-500">创建时间：{formatTime(currentOrder.created_at)}</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatPrice(currentOrder.base_fee + (currentOrder.urgent_fee || 0))}
              </div>
              {currentOrder.urgent_fee && currentOrder.urgent_fee > 0 && (
                <div className="text-sm text-gray-500">
                  基础 {formatPrice(currentOrder.base_fee)} + 急单 {formatPrice(currentOrder.urgent_fee)}
                </div>
              )}
            </div>
          </div>
          {currentOrder.pickup_time && (
            <div className="text-sm text-gray-500">
              期望取餐时间：{new Date(currentOrder.pickup_time).toLocaleString('zh-CN')}
            </div>
          )}
        </div>

        {/* 地址信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">地址信息</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">取餐地址</p>
                <p className="text-gray-900 font-medium">
                  {currentOrder.pickup_location?.name && (
                    <span className="text-blue-600">{currentOrder.pickup_location.name} - </span>
                  )}
                  {currentOrder.pickup_location?.address || '未知地址'}
                </p>
                {currentOrder.pickup_location?.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    联系电话：{currentOrder.pickup_location.phone}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">送达地址</p>
                <p className="text-gray-900 font-medium">
                  {currentOrder.delivery_location?.address || '未知地址'}
                </p>
                {currentOrder.delivery_location?.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    联系电话：{currentOrder.delivery_location.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户信息</h3>
          
          <div className="space-y-4">
            {/* 发单用户 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">发单用户</p>
                  <p className="text-gray-900 font-medium">{currentOrder.user?.name || '未知用户'}</p>
                </div>
              </div>
              
              {!isOwner && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleStartChat}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  {currentOrder.user?.phone && (
                    <a
                      href={`tel:${currentOrder.user.phone}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 配送员 */}
            {currentOrder.deliverer && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">配送员</p>
                    <p className="text-gray-900 font-medium">{currentOrder.deliverer.name}</p>
                  </div>
                </div>
                
                {!isDeliverer && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleStartChat}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    {currentOrder.deliverer.phone && (
                      <a
                        href={`tel:${currentOrder.deliverer.phone}`}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 特殊要求 */}
        {currentOrder.special_requirements && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">特殊要求</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
              {currentOrder.special_requirements}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {canAccept && (
              <button
                onClick={handleAcceptOrder}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '处理中...' : '接受订单'}
              </button>
            )}

            {canUpdateStatus && getNextStatus() && (
              <button
                onClick={() => handleUpdateStatus(getNextStatus()!)}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '处理中...' : getNextStatusText()}
              </button>
            )}

            {canRate && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex-1 bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                评价订单
              </button>
            )}

            {(isOwner || isDeliverer) && (
              <button
                onClick={handleStartChat}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                发送消息
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                取消订单
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 取消订单模态框 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">取消订单</h3>
            <p className="text-gray-600 mb-4">请说明取消原因：</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="请输入取消原因..."
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评价模态框 */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评价订单</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">评分：</p>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">评价内容：</p>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="请输入评价内容..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRateOrder}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '处理中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetail