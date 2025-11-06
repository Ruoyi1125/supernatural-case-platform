import { Case, CaseSearchFilters, CaseStats, CorrelationData, AIPerformanceMetrics } from '../shared/types'

// 案例数据服务
export class CaseService {
  private static instance: CaseService
  private cases: Case[] = []
  
  static getInstance(): CaseService {
    if (!this.instance) {
      this.instance = new CaseService()
      this.instance.initializeMockData()
    }
    return this.instance
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
      },
      {
        id: 'case_004',
        case_name: '包公审鬼盗银案',
        dynasty: '北宋',
        year: '960-1127',
        location: '开封府',
        core_facts: '鬼魂盗取库银，包公夜审查明真相',
        interaction_method: '鬼魂显形陈述',
        judicial_functions: '调查取证、判决执行',
        official_strategy: '阴阳两界，明察秋毫',
        case_category: '阴阳审判',
        evidence_status: '超自然证据为主',
        confidence: 0.91,
        created_at: now,
        updated_at: now
      },
      {
        id: 'case_005',
        case_name: '土地神示梦断案',
        dynasty: '唐朝',
        year: '618-907',
        location: '长安',
        core_facts: '土地神托梦示警，查明土地纠纷真相',
        interaction_method: '神明托梦示警',
        judicial_functions: '土地纠纷调解',
        official_strategy: '借助神明启示',
        case_category: '神明裁决',
        evidence_status: '神明启示',
        confidence: 0.87,
        created_at: now,
        updated_at: now
      }
    ]
  }

  // 获取所有案例
  async getAllCases(): Promise<Case[]> {
    return this.cases
  }

  // 搜索案例
  async searchCases(filters: CaseSearchFilters): Promise<Case[]> {
    return this.cases.filter(case_ => {
      if (filters.dynasty && case_.dynasty !== filters.dynasty) return false
      if (filters.case_category && case_.case_category !== filters.case_category) return false
      if (filters.interaction_method && case_.interaction_method !== filters.interaction_method) return false
      if (filters.evidence_status && case_.evidence_status !== filters.evidence_status) return false
      if (filters.confidence_min && case_.confidence < filters.confidence_min) return false
      if (filters.confidence_max && case_.confidence > filters.confidence_max) return false
      return true
    })
  }

  // 根据ID获取案例
  async getCaseById(id: string): Promise<Case | null> {
    return this.cases.find(case_ => case_.id === id) || null
  }

  // 创建新案例
  async createCase(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>): Promise<Case> {
    const now = new Date().toISOString()
    const newCase: Case = {
      ...caseData,
      id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now
    }
    
    this.cases.push(newCase)
    return newCase
  }

  // 更新案例
  async updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
    const index = this.cases.findIndex(case_ => case_.id === id)
    if (index === -1) return null
    
    this.cases[index] = {
      ...this.cases[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    return this.cases[index]
  }

  // 删除案例
  async deleteCase(id: string): Promise<boolean> {
    const index = this.cases.findIndex(case_ => case_.id === id)
    if (index === -1) return false
    
    this.cases.splice(index, 1)
    return true
  }

  // 获取统计数据
  async getStats(): Promise<CaseStats> {
    const dynastyDistribution: Record<string, number> = {}
    const categoryDistribution: Record<string, number> = {}
    const interactionDistribution: Record<string, number> = {}
    
    let totalConfidence = 0
    
    this.cases.forEach(case_ => {
      // 朝代分布
      dynastyDistribution[case_.dynasty] = (dynastyDistribution[case_.dynasty] || 0) + 1
      
      // 类别分布
      categoryDistribution[case_.case_category] = (categoryDistribution[case_.case_category] || 0) + 1
      
      // 交互方式分布
      interactionDistribution[case_.interaction_method] = (interactionDistribution[case_.interaction_method] || 0) + 1
      
      // 置信度总和
      totalConfidence += case_.confidence
    })
    
    const averageConfidence = totalConfidence / this.cases.length
    
    // 生成月度趋势数据
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }),
        count: Math.floor(Math.random() * 20) + 5
      }
    }).reverse()
    
    return {
      total_cases: this.cases.length,
      dynasty_distribution: dynastyDistribution,
      category_distribution: categoryDistribution,
      interaction_distribution: interactionDistribution,
      average_confidence: averageConfidence,
      monthly_trends
    }
  }

  // 获取关联分析数据
  async getCorrelations(): Promise<CorrelationData> {
    const dynastyInteraction: Record<string, Record<string, number>> = {}
    const categoryEvidence: Record<string, Record<string, number>> = {}
    
    this.cases.forEach(case_ => {
      // 朝代-交互方式关联
      if (!dynastyInteraction[case_.dynasty]) {
        dynastyInteraction[case_.dynasty] = {}
      }
      dynastyInteraction[case_.dynasty][case_.interaction_method] = 
        (dynastyInteraction[case_.dynasty][case_.interaction_method] || 0) + 1
      
      // 类别-证据状态关联
      if (!categoryEvidence[case_.case_category]) {
        categoryEvidence[case_.case_category] = {}
      }
      categoryEvidence[case_.case_category][case_.evidence_status] = 
        (categoryEvidence[case_.case_category][case_.evidence_status] || 0) + 1
    })
    
    // 生成置信度趋势数据
    const confidenceTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        confidence: 0.7 + Math.random() * 0.3
      }
    }).reverse()
    
    return {
      dynasty_interaction: dynastyInteraction,
      category_evidence: categoryEvidence,
      confidence_trends: confidenceTrends
    }
  }

  // 获取AI性能指标
  async getAIPerformance(): Promise<AIPerformanceMetrics> {
    const totalProcessed = this.cases.length
    const avgConfidence = this.cases.reduce((sum, case_) => sum + case_.confidence, 0) / totalProcessed
    
    // 生成每日指标
    const dailyMetrics = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        processed: Math.floor(Math.random() * 10) + 1,
        avg_confidence: 0.75 + Math.random() * 0.2
      }
    }).reverse()
    
    return {
      total_processed: totalProcessed,
      average_confidence: avgConfidence,
      average_processing_time: 2.5 + Math.random() * 1.5, // 2.5-4.0秒
      success_rate: 0.95 + Math.random() * 0.05, // 95-100%
      daily_metrics: dailyMetrics
    }
  }
}