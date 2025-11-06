import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, MessageCircle, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const Header: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // 页面标题映射
  const getPageTitle = () => {
    const path = location.pathname
    
    if (path === '/') return '复旦外卖代取'
    if (path === '/create-order') return '发布订单'
    if (path === '/order-hall') return '订单大厅'
    if (path.startsWith('/order/')) return '订单详情'
    if (path === '/profile') return '个人中心'
    if (path === '/messages') return '消息中心'
    if (path.startsWith('/messages/')) return '聊天'
    
    return '复旦外卖代取'
  }

  // 是否显示返回按钮
  const showBackButton = () => {
    const path = location.pathname
    return path !== '/' && path !== '/order-hall' && path !== '/profile' && path !== '/messages'
  }

  // 是否显示右侧操作按钮
  const showRightActions = () => {
    const path = location.pathname
    return path === '/' || path === '/order-hall'
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleNotifications = () => {
    // TODO: 实现通知功能
    console.log('打开通知')
  }

  const handleMessages = () => {
    navigate('/messages')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧 */}
          <div className="flex items-center">
            {showBackButton() && (
              <button
                onClick={handleBack}
                className="mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* 右侧操作按钮 */}
          {showRightActions() && (
            <div className="flex items-center space-x-2">
              {/* 通知按钮 */}
              <button
                onClick={handleNotifications}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {/* 未读通知红点 */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* 消息按钮 */}
              <button
                onClick={handleMessages}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <MessageCircle className="w-5 h-5 text-gray-600" />
                {/* 未读消息红点 */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* 用户头像 */}
              <button
                onClick={handleProfile}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          )}

          {/* 非主页面的右侧按钮 */}
          {!showRightActions() && location.pathname.startsWith('/messages/') && (
            <div className="flex items-center space-x-2">
              {/* 聊天页面的更多操作 */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header