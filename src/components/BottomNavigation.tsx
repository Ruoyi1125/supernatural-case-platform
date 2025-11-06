import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus, List, MessageCircle, User } from 'lucide-react'

const BottomNavigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: '首页',
      exact: true
    },
    {
      path: '/create-order',
      icon: Plus,
      label: '发单',
      exact: true
    },
    {
      path: '/order-hall',
      icon: List,
      label: '大厅',
      exact: true
    },
    {
      path: '/messages',
      icon: MessageCircle,
      label: '消息',
      exact: false
    },
    {
      path: '/profile',
      icon: User,
      label: '我的',
      exact: true
    }
  ]

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.path
    } else {
      return location.pathname.startsWith(item.path)
    }
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                active
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                className={`w-6 h-6 mb-1 ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`} 
              />
              <span 
                className={`text-xs font-medium ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              
              {/* 未读消息红点 */}
              {item.path === '/messages' && (
                <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation