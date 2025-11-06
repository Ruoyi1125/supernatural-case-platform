import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Eye, Calendar, MapPin, User, ArrowLeft, X } from 'lucide-react'
import { useCaseStore } from '../stores/useCaseStore'
import { Case } from '../shared/types'

const CaseSearch: React.FC = () => {
  const navigate = useNavigate()
  const { cases, loading, searchTerm, filters, setSearchTerm, setFilters, searchCases, loadAllCases } = useCaseStore()
  
  const [showFilters, setShowFilters] = useState(false)

  // 选项数据
  const dynasties = ['北宋', '明朝', '清朝', '唐朝', '汉朝']
  const caseCategories = ['阴阳审判', '神明裁决', '精怪证词', '清官断案', '超自然司法']
  const interactionMethods = ['鬼魂显形陈述', '神明托梦示警', '精怪现身作证', '法术验证', '超自然介入']
  const evidenceStatuses = ['超自然证据为主', '神明启示', '灵异证据', '人证物证为主']

  useEffect(() => {
    loadAllCases()
  }, [])

  useEffect(() => {
    searchCases()
  }, [searchTerm, filters])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setFilters({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    setFilters({})
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
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                返回工作台
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">案例查询</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="搜索案例名称、朝代、地点..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
              {Object.keys(filters).length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">朝代</label>
                  <select
                    value={filters.dynasty || ''}
                    onChange={(e) => handleFilterChange('dynasty', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部</option>
                    {dynasties.map(dynasty => (
                      <option key={dynasty} value={dynasty}>{dynasty}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">案例类别</label>
                  <select
                    value={filters.case_category || ''}
                    onChange={(e) => handleFilterChange('case_category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部</option>
                    {caseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">交互方式</label>
                  <select
                    value={filters.interaction_method || ''}
                    onChange={(e) => handleFilterChange('interaction_method', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部</option>
                    {interactionMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">证据状态</label>
                  <select
                    value={filters.evidence_status || ''}
                    onChange={(e) => handleFilterChange('evidence_status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部</option>
                    {evidenceStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  清除筛选
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  应用筛选
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 结果统计 */}
        <div className="mb-6">
          <p className="text-gray-600">
            找到 <span className="font-semibold text-gray-900">{cases.length}</span> 个案例
          </p>
        </div>

        {/* 案例列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((case_) => (
            <div key={case_.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {case_.case_name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(case_.confidence)}`}>
                    {(case_.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
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

                  <div className="mt-3">
                    <p className="text-gray-700 line-clamp-3">
                      {case_.core_facts}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {new Date(case_.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <button
                      onClick={() => navigate(`/cases/${case_.id}`)}
                      className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {cases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关案例</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CaseSearch