import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Filter, Search, RefreshCw } from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { formatTime, formatPrice, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PLATFORM_MAP, PLATFORM_COLORS } from '../utils'

const OrderHall: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { 
    orders, 
    fetchOrders, 
    isLoading, 
    pagination, 
    error,
    clearError 
  } = useOrderStore()
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    is_urgent: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  useEffect(() => {
    // 检查URL参数
    const view = searchParams.get('view')
    if (view === 'map') {
      // 这里可以添加地图视图的逻辑
      console.log('切换到地图视图')
    }
    
    // 初始加载订单
    loadOrders()
  }, [])

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const loadOrders = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        ...filters,
        search: searchKeyword
      }
      
      await fetchOrders(params)
    } catch (err) {
      console.error('加载订单失败:', err)
    }
  }

  const handleSearch = () => {
    loadOrders(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = () => {
    setShowFilters(false)
    loadOrders(1)
  }

  const clearFilters = () => {
    const defaultFilters = {
      status: '',
      platform: '',
      is_urgent: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    }
    setFilters(defaultFilters)
    setSearchKeyword('')
    loadOrders(1)
  }

  const handleRefresh = () => {
    loadOrders(pagination?.page || 1)
  }

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.pages) {
      loadOrders(pagination.page + 1)
    }
  }

  const handleOrderClick = (orderId: string) => {
    navigate(`/order/${orderId}`)
  }

  const getAvailableOrders = () => {
    return orders.filter(order => order.status === 'pending')
  }

  const availableOrders = getAvailableOrders()

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

      {/* 搜索和筛选栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* 搜索框 */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="搜索订单..."
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 筛选和排序 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>

            <div className="text-sm text-gray-500">
              共 {pagination?.total || 0} 个订单，{availableOrders.length} 个可接单
            </div>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 状态筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">全部状态</option>
                    <option value="pending">待接单</option>
                    <option value="accepted">已接单</option>
                    <option value="picking">取餐中</option>
                    <option value="delivering">配送中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                {/* 平台筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">全部平台</option>
                    <option value="meituan">美团</option>
                    <option value="eleme">饿了么</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* 急单筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={filters.is_urgent}
                    onChange={(e) => handleFilterChange('is_urgent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">全部类型</option>
                    <option value="true">急单</option>
                    <option value="false">普通</option>
                  </select>
                </div>

                {/* 排序 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <select
                    value={`${filters.sort_by}_${filters.sort_order}`}
                    onChange={(e) => {
                      const [sort_by, sort_order] = e.target.value.split('_')
                      handleFilterChange('sort_by', sort_by)
                      handleFilterChange('sort_order', sort_order)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at_desc">最新发布</option>
                    <option value="created_at_asc">最早发布</option>
                    <option value="base_fee_desc">费用最高</option>
                    <option value="base_fee_asc">费用最低</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  清除筛选
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  应用筛选
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无订单</p>
            <p className="text-gray-400 mt-2">等待新订单发布...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 订单状态和标签 */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                        {ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${PLATFORM_COLORS[order.pickup_platform as keyof typeof PLATFORM_COLORS]}`}>
                        {PLATFORM_MAP[order.pickup_platform as keyof typeof PLATFORM_MAP]}
                      </span>
                      {order.is_urgent && (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                          急单
                        </span>
                      )}
                    </div>

                    {/* 地址信息 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">取餐地址</p>
                          <p className="text-gray-900 font-medium">
                            {order.pickup_location?.name && (
                              <span className="text-blue-600">{order.pickup_location.name} - </span>
                            )}
                            {order.pickup_location?.address || '未知地址'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">送达地址</p>
                          <p className="text-gray-900 font-medium">
                            {order.delivery_location?.address || '未知地址'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 特殊要求 */}
                    {order.special_requirements && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">特殊要求</p>
                        <p className="text-gray-900 text-sm bg-gray-50 rounded-lg p-2">
                          {order.special_requirements}
                        </p>
                      </div>
                    )}

                    {/* 时间和费用 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatTime(order.created_at)}</span>
                        {order.pickup_time && (
                          <span className="ml-4">
                            期望取餐：{new Date(order.pickup_time).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(order.base_fee + (order.urgent_fee || 0))}
                        </div>
                        {order.urgent_fee && order.urgent_fee > 0 && (
                          <div className="text-sm text-gray-500">
                            基础 {formatPrice(order.base_fee)} + 急单 {formatPrice(order.urgent_fee)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {pagination && pagination.page < pagination.pages && (
              <div className="text-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      加载中...
                    </div>
                  ) : (
                    '加载更多'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHall