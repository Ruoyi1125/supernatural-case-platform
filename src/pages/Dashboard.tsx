import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, BarChart3, BookOpen, TrendingUp, Clock, Star } from 'lucide-react'

interface Case {
  id: string
  title: string
  dynasty: string
  category: string
  interactionMethod: string
  evidenceStatus: string
  aiConfidence: number
  createdAt: string
}

const Dashboard: React.FC = () => {
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [stats, setStats] = useState({
    totalCases: 0,
    aiProcessed: 0,
    thisWeek: 0,
    pendingReview: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟获取统计数据
    const mockCases: Case[] = [
      {
        id: '1',
        title: '清代狐仙附体案',
        dynasty: '清朝',
        category: '狐仙类',
        interactionMethod: '附体',
        evidenceStatus: '已验证',
        aiConfidence: 0.92,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        title: '明代鬼魂索命案',
        dynasty: '明朝',
        category: '鬼魂类',
        interactionMethod: '托梦',
        evidenceStatus: '待验证',
        aiConfidence: 0.85,
        createdAt: '2024-01-14'
      },
      {
        id: '3',
        title: '宋代山精树怪案',
        dynasty: '宋朝',
        category: '精怪类',
        interactionMethod: '现身',
        evidenceStatus: '已验证',
        aiConfidence: 0.78,
        createdAt: '2024-01-13'
      }
    ]

    setRecentCases(mockCases)
    setStats({
      totalCases: 156,
      aiProcessed: 89,
      thisWeek: 12,
      pendingReview: 5
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">超自然司法案例库</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/cases" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                案例查询
              </Link>
              <Link to="/ai-entry" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                AI录入
              </Link>
              <Link to="/analytics" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                数据分析
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            欢迎使用超自然司法案例库！
          </h2>
          <p className="text-gray-600">
            探索超自然司法案例的数字化研究平台
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总案例数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI已处理</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aiProcessed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本周新增</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待审核</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Link
                to="/ai-entry"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">AI智能录入</p>
                  <p className="text-sm text-gray-600">使用AI自动提取案例信息</p>
                </div>
              </Link>
              <Link
                to="/cases"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Search className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">案例查询</p>
                  <p className="text-sm text-gray-600">搜索和浏览历史案例</p>
                </div>
              </Link>
              <Link
                to="/analytics"
                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">数据分析</p>
                  <p className="text-sm text-gray-600">查看统计图表和趋势</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">使用提示</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>使用AI录入功能可以快速将古籍中的案例数字化</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>案例查询支持按朝代、类别、交互方式等多维度筛选</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>数据分析功能可以帮您发现案例中的规律和趋势</p>
              </div>
            </div>
          </div>
        </div>

        {/* 最近案例 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近案例</h3>
            <Link to="/cases" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              查看全部
            </Link>
          </div>
          <div className="space-y-4">
            {recentCases.map((caseItem) => (
              <div key={caseItem.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {caseItem.title}
                    </Link>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{caseItem.dynasty}</span>
                      <span>{caseItem.category}</span>
                      <span>{caseItem.interactionMethod}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        caseItem.evidenceStatus === '已验证' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {caseItem.evidenceStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>AI置信度: {(caseItem.aiConfidence * 100).toFixed(0)}%</p>
                    <p>{caseItem.createdAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard