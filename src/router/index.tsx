import { createBrowserRouter, Navigate } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import AIDataEntry from '@/pages/AIDataEntry'
import CaseSearch from '@/pages/CaseSearch'
import CaseDetail from '@/pages/CaseDetail'
import DataAnalytics from '@/pages/DataAnalytics'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    path: '/ai-entry',
    element: <AIDataEntry />
  },
  {
    path: '/cases',
    element: <CaseSearch />
  },
  {
    path: '/cases/:id',
    element: <CaseDetail />
  },
  {
    path: '/analytics',
    element: <DataAnalytics />
  },
  // 兜底重定向，避免未知路径导致空白
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
])

export default router