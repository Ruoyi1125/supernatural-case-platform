import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Package, Plus, MessageCircle, User } from 'lucide-react'
import { useMessageStore } from '../stores/messageStore'
import { useAuthStore } from '../stores/authStore'

const Navigation: React.FC = () => {
  const location = useLocation()
  const { unreadCount } = useMessageStore()
  const { user } = useAuthStore()

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: '首页',
      exact: true
    },
    {
      path: '/order-hall',
      icon: Package,
      label: '订单大厅'
    },
    {
      path: '/create-order',
      icon: Plus,
      label: '发单',
      highlight: true
    },
    {
      path: '/message-center',
      icon: MessageCircle,
      label: '消息',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      path: '/profile',
      icon: User,
      label: '我的'
    }
  ]

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  // 如果用户未登录，只显示首页、订单大厅和登录按钮
  if (!user) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around py-2">
            <Link
              to="/"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/', true)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">首页</span>
            </Link>
            
            <Link
              to="/order-hall"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/order-hall')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-6 h-6" />
              <span className="text-xs mt-1">订单大厅</span>
            </Link>
            
            <Link
              to="/login"
              className="flex flex-col items-center py-2 px-3 rounded-lg bg-blue-600 text-white"
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">登录</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path, item.exact)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  active
                    ? 'text-blue-600 bg-blue-50'
                    : item.highlight
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] h-[18px]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Navigation