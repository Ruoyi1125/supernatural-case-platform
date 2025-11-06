import { Case, AIExtractionResult } from '../shared/types'

// 简化的案例存储管理
class CaseStore {
  private cases: Case[] = []
  private listeners: Array<() => void> = []

  constructor() {
    this.initializeMockData()
  }

  // 初始化模拟数据
  private initializeMockData() {
    const now = new Date().toISOString()
    this.cases = [
      {
        id: 'case_001',
        case_name: '包公夜断阴山案',
        dynasty: '北宋',
        year: '960-1127',
        location: '开封府',
        core_facts: '包拯夜审案件，鬼魂显形陈述冤情，查明真相',
        interaction_method: '鬼魂显形陈述',
        judicial_functions: '调查取证、判决执行',
        official_strategy: '借助超自然力量查明真相',
        case_category: '阴阳审判',
        evidence_status: '超自然证据为主',
        confidence: 0.95,
        created_at: now,
        updated_at: now
      },
      {
        id: 'case_002',
        case_name: '城隍显灵判冤案',
        dynasty: '明朝',
        year: '1522-1566',
        location: '苏州府吴县',
        core_facts: '商人客死他乡，城隍托梦示警，县令明察秋毫',
        interaction_method: '神明托梦示警',
        judicial_functions: '审理判决、神明启示',
        official_strategy: '依神明启示查明真相',
        case_category: '神明裁决',
        evidence_status: '神明启示',
        confidence: 0.88,
        created_at: now,
        updated_at: now
      },
      {
        id: 'case_003',
        case_name: '狐仙作证奇案',
        dynasty: '清朝',
        year: '1736-1795',
        location: '山东济南府',
        core_facts: '狐仙现身作证，促成良缘，化解纠纷',
        interaction_method: '精怪现身作证',
        judicial_functions: '调解纠纷、证婚',
        official_strategy: '顺应天意，成人之美',
        case_category: '精怪证词',
        evidence_status: '灵异证据',
        confidence: 0.82,
        created_at: now,
        updated_at: now
      }
    ]
  }

  // 添加案例
  addCase(caseData: Case) {
    this.cases.push(caseData)
    this.notifyListeners()
  }

  // 获取所有案例
  getAllCases(): Case[] {
    return [...this.cases]
  }

  // 根据ID获取案例
  getCaseById(id: string): Case | undefined {
    return this.cases.find(c => c.id === id)
  }

  // 搜索案例
  searchCases(searchTerm: string, filters: any = {}): Case[] {
    return this.cases.filter(case_ => {
      // 搜索词匹配
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesSearch = 
          case_.case_name.toLowerCase().includes(term) ||
          case_.dynasty.toLowerCase().includes(term) ||
          case_.location.toLowerCase().includes(term) ||
          case_.case_category.toLowerCase().includes(term) ||
          case_.interaction_method.toLowerCase().includes(term)
        
        if (!matchesSearch) return false
      }

      // 过滤器
      if (filters.dynasty && case_.dynasty !== filters.dynasty) return false
      if (filters.case_category && case_.case_category !== filters.case_category) return false
      if (filters.interaction_method && case_.interaction_method !== filters.interaction_method) return false
      if (filters.evidence_status && case_.evidence_status !== filters.evidence_status) return false
      if (filters.confidence_min && case_.confidence < filters.confidence_min) return false
      if (filters.confidence_max && case_.confidence > filters.confidence_max) return false

      return true
    })
  }

  // 添加监听器
  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

// 创建全局实例
export const caseStore = new CaseStore()

// 将AI提取结果转换为案例格式
export function convertAIResultToCase(aiResult: AIExtractionResult): Case {
  const now = new Date().toISOString()
  
  return {
    id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    case_name: aiResult.case_name,
    dynasty: aiResult.dynasty,
    year: aiResult.year,
    location: aiResult.location,
    core_facts: aiResult.core_facts,
    interaction_method: aiResult.interaction_method,
    judicial_functions: aiResult.judicial_functions,
    official_strategy: aiResult.official_strategy,
    case_category: aiResult.case_category,
    evidence_status: aiResult.evidence_status,
    confidence: aiResult.confidence,
    created_at: now,
    updated_at: now
  }
}