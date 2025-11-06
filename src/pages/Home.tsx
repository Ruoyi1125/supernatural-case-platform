import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Plus, 
  RefreshCw,
  TrendingUp,
  Bell,
  Navigation
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { formatTime, formatPrice, ORDER_STATUS_MAP, ORDER_STATUS_COLORS, PLATFORM_MAP } from '../utils'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    orders, 
    isLoading, 
    error,
    fetchOrders, 
    fetchOrderStats,
    clearError 
  } = useOrderStore()

  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // 加载数据
  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      
      // 并行加载订单和统计数据
      await Promise.all([
        fetchOrders({ page: 1, limit: 10 }),
        loadStats()
      ])
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      if (showRefreshing) setIsRefreshing(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      const statsData = await fetchOrderStats()
      setStats(statsData)
    } catch (err) {
      console.error('加载统计数据失败:', err)
      // 设置默认值
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalEarnings: 0
      })
    }
  }

  useEffect(() => {
    loadData()
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
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

  const handleCreateOrder = () => {
    navigate('/create-order')
  }

  const handleViewOrderHall = () => {
    navigate('/order-hall')
  }

  const handleOrderClick = (orderId: string) => {
    navigate(`/order/${orderId}`)
  }

  const handleRefresh = () => {
    loadData(true)
  }

  const handleMapNavigation = () => {
    navigate('/order-hall?view=map')
  }

  const handleNotifications = () => {
    navigate('/message-center')
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

      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                欢迎回来，{user?.name || '用户'}！
              </h1>
              <p className="text-blue-100">
                今天也要加油哦～
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNotifications}
                className="p-2 bg-blue-500 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-blue-500 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-right">
                <p className="text-blue-100 text-sm">当前时间</p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">总订单</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">进行中</p>
                <p className="text-lg font-semibold text-gray-900">{stats.activeOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">已完成</p>
                <p className="text-lg font-semibold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">总收益</p>
                <p className="text-lg font-semibold text-gray-900">{formatPrice(stats.totalEarnings)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateOrder}
            className="bg-blue-600 text-white rounded-lg p-6 flex flex-col items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">发布订单</span>
            <span className="text-sm text-blue-100 mt-1">快速发单</span>
          </button>

          <button
            onClick={handleViewOrderHall}
            className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-8 h-8 mb-2 text-gray-600" />
            <span className="font-medium text-gray-900">订单大厅</span>
            <span className="text-sm text-gray-500 mt-1">接单赚钱</span>
          </button>

          <button
            onClick={handleMapNavigation}
            className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors md:block hidden"
          >
            <Navigation className="w-8 h-8 mb-2 text-gray-600" />
            <span className="font-medium text-gray-900">地图导航</span>
            <span className="text-sm text-gray-500 mt-1">查看附近</span>
          </button>
        </div>
      </div>

      {/* 最新订单 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最新订单</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  更新于 {lastRefresh.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleViewOrderHall}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  查看全部
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-500">加载中...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无订单</p>
                <p className="text-sm text-gray-400 mt-1">快去发布第一个订单吧！</p>
                <button
                  onClick={handleCreateOrder}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  立即发单
                </button>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                          {ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {PLATFORM_MAP[order.pickup_platform as keyof typeof PLATFORM_MAP]}
                        </span>
                        {order.is_urgent && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            急单
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>取餐：{order.pickup_location?.address || '未知地址'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>送达：{order.delivery_location?.address || '未知地址'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {formatTime(order.created_at)}
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          {formatPrice(order.base_fee + (order.urgent_fee || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 底部间距 */}
      <div className="h-6"></div>
    </div>
  )
}

export default Home