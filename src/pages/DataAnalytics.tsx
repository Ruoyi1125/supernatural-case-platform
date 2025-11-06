import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, PieChart, Users, Calendar, Filter, Download, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_cases: number
    dynasty_distribution: Record<string, number>
    interaction_distribution: Record<string, number>
    case_category_distribution: Record<string, number>
    monthly_trend: Array<{month: string, count: number}>
  }
  correlation_analysis: Array<{factor1: string, factor2: string, correlation: number}>
  ai_performance: {
    total_processed: number
    average_confidence: number
    processing_time_stats: {min: number, max: number, avg: number}
  }
}

const DataAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'correlations' | 'ai'>('overview')
  const [timeRange, setTimeRange] = useState('12months')

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      const mockData: AnalyticsData = {
        overview: {
          total_cases: 1248,
          dynasty_distribution: {
            '北宋': 156,
            '南宋': 89,
            '元朝': 134,
            '明朝': 287,
            '清朝': 398,
            '唐朝': 98,
            '汉朝': 56
          },
          interaction_distribution: {
            '鬼魂显形陈述': 234,
            '神明托梦示警': 189,
            '精怪现身作证': 156,
            '天象示警': 134,
            '符咒显灵': 98,
            '占卜问卦': 87,
            '其他': 350
          },
          case_category_distribution: {
            '阴阳审判': 298,
            '神明裁决': 234,
            '精怪证词': 189,
            '托梦断案': 156,
            '显灵破案': 134,
            '天谴惩罚': 98,
            '其他': 139
          },
          monthly_trend: [
            {month: '2023-01', count: 45},
            {month: '2023-02', count: 52},
            {month: '2023-03', count: 48},
            {month: '2023-04', count: 61},
            {month: '2023-05', count: 58},
            {month: '2023-06', count: 67},
            {month: '2023-07', count: 72},
            {month: '2023-08', count: 69},
            {month: '2023-09', count: 74},
            {month: '2023-10', count: 81},
            {month: '2023-11', count: 78},
            {month: '2023-12', count: 85}
          ]
        },
        correlation_analysis: [
          {factor1: '朝代稳定性', factor2: '超自然案例频率', correlation: -0.75},
          {factor1: '案件复杂度', factor2: 'AI置信度', correlation: -0.68},
          {factor1: '证据充分性', factor2: '案例完整性', correlation: 0.82},
          {factor1: '官员级别', factor2: '超自然介入程度', correlation: 0.65},
          {factor1: '社会动荡', factor2: '神明裁决案例', correlation: 0.71}
        ],
        ai_performance: {
          total_processed: 892,
          average_confidence: 0.84,
          processing_time_stats: {min: 1.2, max: 8.5, avg: 3.2}
        }
      }
      setData(mockData)
      setLoading(false)
    }, 1500)
  }, [])

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const exportData = () => {
    // 模拟数据导出
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载分析数据中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">数据分析</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="1month">最近1个月</option>
                <option value="3months">最近3个月</option>
                <option value="6months">最近6个月</option>
                <option value="12months">最近12个月</option>
                <option value="all">全部时间</option>
              </select>
              <button
                onClick={refreshData}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                刷新
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签导航 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {id: 'overview', name: '概览统计', icon: BarChart3},
                {id: 'trends', name: '趋势分析', icon: TrendingUp},
                {id: 'correlations', name: '关联分析', icon: PieChart},
                {id: 'ai', name: 'AI性能', icon: Users}
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 概览统计 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 总览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总案例数</p>
                    <p className="text-3xl font-bold text-gray-900">{data.overview.total_cases}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均置信度</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(data.ai_performance.average_confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI处理数</p>
                    <p className="text-3xl font-bold text-gray-900">{data.ai_performance.total_processed}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均处理时间</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.ai_performance.processing_time_stats.avg}s
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* 分布图表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 朝代分布 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">朝代分布</h3>
                <div className="space-y-3">
                  {Object.entries(data.overview.dynasty_distribution)
                    .sort(([,a], [,b]) => b - a)
                    .map(([dynasty, count]) => (
                      <div key={dynasty} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dynasty}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${(count / Math.max(...Object.values(data.overview.dynasty_distribution))) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* 交互方式分布 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">交互方式</h3>
                <div className="space-y-3">
                  {Object.entries(data.overview.interaction_distribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate">{method}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{width: `${(count / Math.max(...Object.values(data.overview.interaction_distribution))) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* 案例类别分布 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">案例类别</h3>
                <div className="space-y-3">
                  {Object.entries(data.overview.case_category_distribution)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{width: `${(count / Math.max(...Object.values(data.overview.case_category_distribution))) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 趋势分析 */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* 月度趋势 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">月度新增案例趋势</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {data.overview.monthly_trend.map((month, index) => (
                  <div key={month.month} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-600 rounded-t" 
                      style={{height: `${(month.count / Math.max(...data.overview.monthly_trend.map(m => m.count))) * 200}px`}}
                      title={`${month.month}: ${month.count}个案例`}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center">
                      {month.month.split('-')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 增长分析 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">增长率分析</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月度平均增长</span>
                    <span className="font-semibold text-green-600">+5.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">季度平均增长</span>
                    <span className="font-semibold text-green-600">+15.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">年度增长预测</span>
                    <span className="font-semibold text-green-600">+68.5%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">峰值分析</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">最高月份</span>
                    <span className="font-semibold text-blue-600">2023-12 (85个)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">最低月份</span>
                    <span className="font-semibold text-orange-600">2023-01 (45个)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">波动系数</span>
                    <span className="font-semibold text-purple-600">0.23</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 关联分析 */}
        {activeTab === 'correlations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">因素关联分析</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        因素1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        因素2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        相关系数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        关联强度
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.correlation_analysis.map((correlation, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {correlation.factor1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {correlation.factor2}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-semibold ${
                            Math.abs(correlation.correlation) >= 0.7 ? 'text-red-600' :
                            Math.abs(correlation.correlation) >= 0.5 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {correlation.correlation.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            Math.abs(correlation.correlation) >= 0.7 ? 'bg-red-100 text-red-800' :
                            Math.abs(correlation.correlation) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {Math.abs(correlation.correlation) >= 0.7 ? '强' :
                             Math.abs(correlation.correlation) >= 0.5 ? '中' : '弱'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 关联洞察 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">强关联发现</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-1">负向强关联</h4>
                    <p className="text-sm text-red-700">
                      朝代稳定性与超自然案例频率呈强负相关(-0.75)，表明社会动荡时期更多依赖超自然力量解决司法问题。
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">正向强关联</h4>
                    <p className="text-sm text-green-700">
                      证据充分性与案例完整性呈强正相关(0.82)，说明证据保存越完整，案例记录越详细。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">分析建议</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>重点关注中等强度关联，可能揭示隐藏的规律</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>结合历史背景理解负向关联的实际意义</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>定期更新关联分析，跟踪趋势变化</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>结合定性分析验证量化关联结果</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI性能分析 */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* AI性能概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">处理统计</h3>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">总处理数</span>
                    <span className="font-semibold">{data.ai_performance.total_processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">成功率</span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">失败数</span>
                    <span className="font-semibold text-red-600">14</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">置信度分析</h3>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均置信度</span>
                    <span className="font-semibold text-green-600">
                      {(data.ai_performance.average_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">高置信度(&gt;90%)</span>
                    <span className="font-semibold text-green-600">67.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">低置信度(&lt;70%)</span>
                    <span className="font-semibold text-orange-600">8.3%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">处理时间</h3>
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">最快处理</span>
                    <span className="font-semibold">{data.ai_performance.processing_time_stats.min}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均处理</span>
                    <span className="font-semibold">{data.ai_performance.processing_time_stats.avg}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最慢处理</span>
                    <span className="font-semibold">{data.ai_performance.processing_time_stats.max}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI优化建议 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI优化建议</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">性能优化</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>优化文本预处理，减少无效信息干扰</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>增强历史语境理解能力</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-orange-600 mr-2">△</span>
                      <span>改进模糊文本的处理策略</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">准确性提升</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span>增加训练样本，特别是边缘案例</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span>引入专家知识验证机制</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span>建立多模型集成预测</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataAnalytics