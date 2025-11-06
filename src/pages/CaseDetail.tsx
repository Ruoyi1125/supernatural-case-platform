import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, User, FileText, Sparkles, TrendingUp, Clock } from 'lucide-react'
import { caseStore } from '../stores/caseStore'
import { Case } from '../shared/types'

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [case_, setCase_] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const foundCase = caseStore.getCaseById(id)
      setCase_(foundCase || null)
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!case_) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">案例不存在</h2>
          <p className="text-gray-600 mb-4">未找到指定的案例</p>
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回案例列表
          </button>
        </div>
      </div>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100'
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/cases')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                返回案例列表
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">案例详情</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 案例标题 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{case_.case_name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(case_.confidence)}`}>
              AI置信度: {(case_.confidence * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{case_.dynasty} · {case_.year}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{case_.location}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{case_.case_category}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：案例信息 */}
          <div className="space-y-6">
            {/* 核心事实 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                核心事实
              </h3>
              <p className="text-gray-700 leading-relaxed">{case_.core_facts}</p>
            </div>

            {/* 交互方式 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                超自然交互
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">交互方式：</span>
                  <span className="text-gray-900 ml-2">{case_.interaction_method}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">证据状态：</span>
                  <span className="text-gray-900 ml-2">{case_.evidence_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：分析信息 */}
          <div className="space-y-6">
            {/* 司法功能 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                司法功能
              </h3>
              <p className="text-gray-700">{case_.judicial_functions}</p>
            </div>

            {/* 官员策略 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                官员策略
              </h3>
              <p className="text-gray-700">{case_.official_strategy}</p>
            </div>

            {/* 案例信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                案例信息
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">案例ID：</span>
                  <span className="text-gray-900 font-mono">{case_.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间：</span>
                  <span className="text-gray-900">
                    {new Date(case_.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">更新时间：</span>
                  <span className="text-gray-900">
                    {new Date(case_.updated_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            返回列表
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回工作台
          </button>
        </div>
      </div>
    </div>
  )
}

export default CaseDetail