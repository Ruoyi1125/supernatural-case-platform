import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Brain, ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react'

interface AIExtractionResult {
  case_name: string
  dynasty: string
  year: string
  location: string
  core_facts: string
  interaction_method: string
  judicial_functions: string
  official_strategy: string
  case_category: string
  evidence_status: string
  confidence: number
}

const AIDataEntry: React.FC = () => {
  const navigate = useNavigate()
  const [rawText, setRawText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input')

  const sampleTexts = [
    {
      title: '包公夜断阴山案',
      content: '北宋年间，包拯任开封府尹。一夜，有妇人王氏击鼓鸣冤，称其夫张明前日入山采药，至今未归。包公夜审此案，忽见阴风阵阵，灯烛尽灭。须臾，张明之魂显形，哭诉其被同乡李二谋财害命，弃尸山崖。包公次日派衙役搜山，果于崖下发现张明尸体，并捕获李二。李二见尸首败露，供认不讳。包公依律判李二斩首，并命人将张明尸首送还其妻安葬。'
    },
    {
      title: '城隍显灵判冤案',
      content: '明嘉靖年间，苏州府吴县有商人赵德，外出经商三年未归。其妻钱氏改嫁孙三。不料赵德突然归家，控告钱氏与孙三通奸谋害。县令审理此案，双方各执一词。当夜，县令梦见城隍神显灵，示以真相：赵德外出经商，客死他乡，今之归者乃其魂也。县令次日再审，赵德果然言语混乱，形迹可疑。以符咒试之，赵德乃现原形，实为其魂所化。县令据此判钱氏无罪，孙三亦无罪，赵德之魂乃安然离去。'
    },
    {
      title: '狐仙作证奇案',
      content: '清朝乾隆年间，山东济南府有富户刘员外，其子刘明与贫女周小莲相恋。刘员外嫌贫爱富，强行将子另配富家女王氏。成婚之夜，忽有一白狐显身，口吐人言，作证刘明与周小莲前世有缘，今生当为夫妻。狐仙又言王氏乃恶人转世，若娶之必遭横祸。刘员外惊恐，请道士驱狐。道士至，狐仙乃现真身，原来是小莲所养灵狐。道士言此乃天意，不可违逆。刘员外终允刘明与小莲成婚，王氏亦另嫁他人，皆大欢喜。'
    }
  ]

  const handleSubmit = async () => {
    if (!rawText.trim()) {
      alert('请输入案例文本')
      return
    }

    setIsProcessing(true)
    
    try {
      // 模拟AI处理
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 模拟AI提取结果
      const mockResult: AIExtractionResult = {
        case_name: rawText.includes('包公') ? '包公夜断阴山案' : 
                  rawText.includes('城隍') ? '城隍显灵判冤案' : 
                  rawText.includes('狐仙') ? '狐仙作证奇案' : '未命名案例',
        dynasty: rawText.includes('北宋') ? '北宋' : 
                rawText.includes('明嘉靖') ? '明朝' : 
                rawText.includes('乾隆') ? '清朝' : '未知',
        year: rawText.includes('北宋') ? '960-1127' : 
              rawText.includes('明嘉靖') ? '1522-1566' : 
              rawText.includes('乾隆') ? '1736-1795' : '未知',
        location: rawText.includes('开封') ? '开封府' : 
                  rawText.includes('苏州') ? '苏州府吴县' : 
                  rawText.includes('济南') ? '山东济南府' : '未知',
        core_facts: rawText.substring(0, 100) + '...',
        interaction_method: rawText.includes('包公') ? '鬼魂显形陈述' : 
                           rawText.includes('城隍') ? '神明托梦示警' : 
                           rawText.includes('狐仙') ? '精怪现身作证' : '超自然介入',
        judicial_functions: '调查取证、判决执行',
        official_strategy: '借助超自然力量查明真相',
        case_category: rawText.includes('包公') ? '阴阳审判' : 
                        rawText.includes('城隍') ? '神明裁决' : 
                        rawText.includes('狐仙') ? '精怪证词' : '超自然司法',
        evidence_status: '超自然证据为主',
        confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0的置信度
      }
      
      setExtractionResult(mockResult)
      setActiveTab('result')
    } catch (error) {
      console.error('AI处理失败:', error)
      alert('AI处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveCase = async () => {
    if (!extractionResult) return
    
    try {
      // 这里应该调用API保存案例
      console.log('保存案例:', extractionResult)
      alert('案例保存成功！')
      navigate('/cases')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    }
  }

  const loadSampleText = (sample: typeof sampleTexts[0]) => {
    setRawText(sample.content)
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
              <h1 className="text-xl font-semibold text-gray-900">AI智能录入</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签页 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('input')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'input'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  文本输入
                </div>
              </button>
              <button
                onClick={() => setActiveTab('result')}
                disabled={!extractionResult}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'result'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  提取结果
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 输入标签页 */}
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 文本输入区域 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">输入案例文本</h3>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="请粘贴或输入古代司法案例的原始文本，AI将自动提取关键信息..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    字符数: {rawText.length}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing || !rawText.trim()}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI处理中...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        开始AI提取
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 示例文本 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">示例文本</h3>
                <div className="space-y-4">
                  {sampleTexts.map((sample, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{sample.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {sample.content.substring(0, 100)}...
                      </p>
                      <button
                        onClick={() => loadSampleText(sample)}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                      >
                        使用此示例
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 结果标签页 */}
        {activeTab === 'result' && extractionResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">AI提取结果</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  置信度: {(extractionResult.confidence * 100).toFixed(1)}%
                </div>
                <button
                  onClick={handleSaveCase}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" />
                  保存案例
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">案例名称</label>
                  <input
                    type="text"
                    value={extractionResult.case_name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">朝代</label>
                  <input
                    type="text"
                    value={extractionResult.dynasty}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
                  <input
                    type="text"
                    value={extractionResult.year}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                  <input
                    type="text"
                    value={extractionResult.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">交互方式</label>
                  <input
                    type="text"
                    value={extractionResult.interaction_method}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">案例类别</label>
                  <input
                    type="text"
                    value={extractionResult.case_category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">证据状态</label>
                  <input
                    type="text"
                    value={extractionResult.evidence_status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">核心事实</label>
                <textarea
                  value={extractionResult.core_facts}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">司法功能</label>
                <textarea
                  value={extractionResult.judicial_functions}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">官员策略</label>
                <textarea
                  value={extractionResult.official_strategy}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDataEntry