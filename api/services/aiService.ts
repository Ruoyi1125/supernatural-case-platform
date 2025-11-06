import { Case, AIExtractionRequest, AIExtractionResponse } from '../shared/types'

// 模拟AI提取服务
export class AIService {
  private static instance: AIService
  
  static getInstance(): AIService {
    if (!this.instance) {
      this.instance = new AIService()
    }
    return this.instance
  }

  // 模拟AI文本提取
  async extractCaseData(request: AIExtractionRequest): Promise<AIExtractionResponse> {
    try {
      // 模拟AI处理延迟
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
      
      const result = this.simulateAIExtraction(request.raw_text)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI提取失败'
      }
    }
  }

  // 模拟AI提取逻辑
  private simulateAIExtraction(rawText: string): Case {
    const now = new Date().toISOString()
    
    // 基础信息提取
    const dynasty = this.extractDynasty(rawText)
    const location = this.extractLocation(rawText)
    const caseCategory = this.categorizeCase(rawText)
    const interactionMethod = this.extractInteractionMethod(rawText)
    
    // 生成案例名称
    const caseName = this.generateCaseName(rawText)
    
    return {
      id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      case_name: caseName,
      dynasty,
      year: this.getYearRange(dynasty),
      location,
      core_facts: this.extractCoreFacts(rawText),
      interaction_method: interactionMethod,
      judicial_functions: this.extractJudicialFunctions(rawText),
      official_strategy: this.extractOfficialStrategy(rawText),
      case_category: caseCategory,
      evidence_status: this.determineEvidenceStatus(interactionMethod),
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0的置信度
      created_at: now,
      updated_at: now
    }
  }

  // 提取朝代
  private extractDynasty(text: string): string {
    const dynastyKeywords = {
      '北宋': ['北宋', '包拯', '开封'],
      '明朝': ['明嘉靖', '明朝', '嘉靖'],
      '清朝': ['清朝', '乾隆', '康熙'],
      '唐朝': ['唐朝', '贞观', '开元'],
      '汉朝': ['汉朝', '西汉', '东汉']
    }
    
    for (const [dynasty, keywords] of Object.entries(dynastyKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return dynasty
      }
    }
    
    return '未知'
  }

  // 提取地点
  private extractLocation(text: string): string {
    const locationKeywords = {
      '开封府': ['开封', '开封府'],
      '苏州府吴县': ['苏州', '吴县'],
      '山东济南府': ['济南', '山东'],
      '长安': ['长安', '西安'],
      '洛阳': ['洛阳']
    }
    
    for (const [location, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return location
      }
    }
    
    return '未知'
  }

  // 案例分类
  private categorizeCase(text: string): string {
    if (text.includes('鬼魂') || text.includes('魂') || text.includes('阴山')) {
      return '阴阳审判'
    }
    if (text.includes('城隍') || text.includes('神') || text.includes('托梦')) {
      return '神明裁决'
    }
    if (text.includes('狐仙') || text.includes('精怪') || text.includes('妖')) {
      return '精怪证词'
    }
    if (text.includes('包公') || text.includes('包拯')) {
      return '清官断案'
    }
    
    return '超自然司法'
  }

  // 提取交互方式
  private extractInteractionMethod(text: string): string {
    if (text.includes('鬼魂显形') || text.includes('魂') || text.includes('阴风')) {
      return '鬼魂显形陈述'
    }
    if (text.includes('托梦') || text.includes('神') || text.includes('城隍')) {
      return '神明托梦示警'
    }
    if (text.includes('狐仙') || text.includes('精怪') || text.includes('口吐人言')) {
      return '精怪现身作证'
    }
    if (text.includes('符咒') || text.includes('法术')) {
      return '法术验证'
    }
    
    return '超自然介入'
  }

  // 生成案例名称
  private generateCaseName(text: string): string {
    if (text.includes('包公') || text.includes('包拯')) {
      return '包公夜断阴山案'
    }
    if (text.includes('城隍')) {
      return '城隍显灵判冤案'
    }
    if (text.includes('狐仙')) {
      return '狐仙作证奇案'
    }
    
    // 从文本中提取关键信息生成名称
    const keyEvents = text.match(/[^。！？]+[。！？]/g) || []
    if (keyEvents.length > 0) {
      const firstEvent = keyEvents[0].replace(/[。！？]/g, '')
      if (firstEvent.length <= 20) {
        return firstEvent + '案'
      }
    }
    
    return '超自然司法案例'
  }

  // 获取年份范围
  private getYearRange(dynasty: string): string {
    const yearRanges = {
      '北宋': '960-1127',
      '明朝': '1368-1644',
      '清朝': '1644-1912',
      '唐朝': '618-907',
      '汉朝': '202BC-220AD'
    }
    
    return yearRanges[dynasty as keyof typeof yearRanges] || '未知'
  }

  // 提取核心事实
  private extractCoreFacts(text: string): string {
    const sentences = text.split(/[。！？]/)
    const keySentences = sentences.slice(0, 3).join('。')
    return keySentences + (sentences.length > 3 ? '...' : '')
  }

  // 提取司法功能
  private extractJudicialFunctions(text: string): string {
    const functions = []
    
    if (text.includes('审理') || text.includes('判')) {
      functions.push('审理判决')
    }
    if (text.includes('调查') || text.includes('查明')) {
      functions.push('调查取证')
    }
    if (text.includes('执行') || text.includes('斩首')) {
      functions.push('执行刑罚')
    }
    if (functions.length === 0) {
      functions.push('司法审判')
    }
    
    return functions.join('、')
  }

  // 提取官员策略
  private extractOfficialStrategy(text: string): string {
    if (text.includes('借助') || text.includes('借助超自然')) {
      return '借助超自然力量查明真相'
    }
    if (text.includes('请道士') || text.includes('驱狐')) {
      return '请专业人士协助处理'
    }
    if (text.includes('派衙役') || text.includes('搜山')) {
      return '实地调查取证'
    }
    
    return '依法审理，明察秋毫'
  }

  // 确定证据状态
  private determineEvidenceStatus(interactionMethod: string): string {
    if (interactionMethod.includes('鬼魂') || interactionMethod.includes('神明')) {
      return '超自然证据为主'
    }
    if (interactionMethod.includes('精怪') || interactionMethod.includes('法术')) {
      return '灵异证据'
    }
    
    return '人证物证为主'
  }
}