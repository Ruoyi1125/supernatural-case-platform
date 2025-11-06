import React, { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { initializeSocket } from '../utils/socket'
import BottomNavigation from './BottomNavigation'
import Header from './Header'

// 页面组件
import Home from '../pages/Home'
import CreateOrder from '../pages/CreateOrder'
import OrderHall from '../pages/OrderHall'
import OrderDetail from '../pages/OrderDetail'
import Profile from '../pages/Profile'
import Messages from '../pages/Messages'
import MessageDetail from '../pages/MessageDetail'

const Layout: React.FC = () => {
  const location = useLocation()
  const { user, token } = useAuthStore()

  useEffect(() => {
    // 初始化 Socket 连接
    if (user && token) {
      try {
        initializeSocket(token)
      } catch (error) {
        console.error('Socket initialization failed:', error)
      }
    }
  }, [user, token])

  // 不显示底部导航的页面
  const hideBottomNavPages = ['/messages/', '/order/']
  const shouldHideBottomNav = hideBottomNavPages.some(page => 
    location.pathname.startsWith(page)
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <Header />
      
      {/* 主内容区域 */}
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/order-hall" element={<OrderHall />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:orderId" element={<MessageDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* 底部导航 - 仅在移动端显示，某些页面隐藏 */}
      {!shouldHideBottomNav && (
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      )}
    </div>
  )
}

export default Layout