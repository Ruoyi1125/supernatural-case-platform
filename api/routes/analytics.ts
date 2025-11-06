import express, { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取统计概览
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取案例总数
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    // 获取朝代分布
    const { data: dynastyData } = await supabase
      .from('cases')
      .select('dynasty')
      .eq('is_verified', true)

    const dynastyDistribution = dynastyData?.reduce((acc, item) => {
      acc[item.dynasty] = (acc[item.dynasty] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 获取互动方式分布
    const { data: interactionData } = await supabase
      .from('cases')
      .select('interaction_method')
      .eq('is_verified', true)

    const interactionDistribution = interactionData?.reduce((acc, item) => {
      if (item.interaction_method) {
        acc[item.interaction_method] = (acc[item.interaction_method] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // 获取案件类型分布
    const { data: caseTypeData } = await supabase
      .from('cases')
      .select('case_category')
      .eq('is_verified', true)

    const caseTypeDistribution = caseTypeData?.reduce((acc, item) => {
      if (item.case_category) {
        acc[item.case_category] = (acc[item.case_category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // 获取官员策略分布
    const { data: strategyData } = await supabase
      .from('cases')
      .select('official_strategy')
      .eq('is_verified', true)

    const strategyDistribution = strategyData?.reduce((acc, item) => {
      if (item.official_strategy) {
        acc[item.official_strategy] = (acc[item.official_strategy] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // 获取月度趋势（最近6个月）
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const { count } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      monthlyTrends.push({
        month: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
        count: count || 0
      })
    }

    res.json({
      success: true,
      data: {
        total_cases: totalCases || 0,
        dynasty_distribution: dynastyDistribution,
        interaction_distribution: interactionDistribution,
        case_type_distribution: caseTypeDistribution,
        strategy_distribution: strategyDistribution,
        monthly_trends: monthlyTrends,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    next(error)
  }
})

// 生成分析报告
router.post('/report', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { report_type, time_range, filters = {} } = req.body

    if (!report_type) {
      return res.status(400).json({
        success: false,
        error: '报告类型不能为空'
      })
    }

    let reportData = {}
    let reportTitle = ''

    switch (report_type) {
      case 'comprehensive':
        reportTitle = '综合分析报告'
        reportData = await generateComprehensiveReport(time_range, filters)
        break

      case 'dynasty':
        reportTitle = '朝代对比分析报告'
        reportData = await generateDynastyReport(time_range, filters)
        break

      case 'interaction':
        reportTitle = '互动方式分析报告'
        reportData = await generateInteractionReport(time_range, filters)
        break

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的报告类型'
        })
    }

    // 保存分析记录
    await supabase.from('analytics').insert({
      user_id: req.user.id,
      analysis_type: `report_${report_type}`,
      parameters: { report_type, time_range, filters },
      results: {
        title: reportTitle,
        data: reportData,
        generated_at: new Date().toISOString()
      }
    })

    res.json({
      success: true,
      report_title: reportTitle,
      report_data: reportData,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    next(error)
  }
})

// 获取高级统计数据
router.get('/advanced', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { metric, group_by, filters = {} } = req.query

    if (!metric) {
      return res.status(400).json({
        success: false,
        error: '统计指标不能为空'
      })
    }

    let query = supabase
      .from('cases')
      .select('*')
      .eq('is_verified', true)

    // 应用筛选条件
    if (filters.dynasty) {
      query = query.eq('dynasty', filters.dynasty)
    }
    if (filters.interaction_method) {
      query = query.eq('interaction_method', filters.interaction_method)
    }
    if (filters.case_category) {
      query = query.eq('case_category', filters.case_category)
    }

    const { data } = await query

    if (!data) {
      return res.json({
        success: true,
        data: []
      })
    }

    let result = []

    switch (metric) {
      case 'correlation':
        result = analyzeCorrelation(data, group_by as string)
        break

      case 'trend':
        result = analyzeTrend(data, group_by as string)
        break

      case 'distribution':
        result = analyzeDistribution(data, group_by as string)
        break

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的统计指标'
        })
    }

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    next(error)
  }
})

// 辅助函数：生成综合报告
async function generateComprehensiveReport(time_range: any, filters: any) {
  const baseQuery = supabase
    .from('cases')
    .select('*')
    .eq('is_verified', true)

  // 应用时间范围筛选
  if (time_range?.start_date) {
    baseQuery.gte('created_at', time_range.start_date)
  }
  if (time_range?.end_date) {
    baseQuery.lte('created_at', time_range.end_date)
  }

  const { data } = await baseQuery

  return {
    total_cases: data?.length || 0,
    summary_statistics: {
      avg_interaction_methods: calculateAverageInteractionMethods(data),
      most_common_dynasty: findMostCommonValue(data, 'dynasty'),
      most_common_case_type: findMostCommonValue(data, 'case_category'),
      most_common_strategy: findMostCommonValue(data, 'official_strategy')
    },
    quality_metrics: {
      verified_percentage: calculateVerifiedPercentage(data),
      average_confidence_score: await calculateAverageConfidenceScore(data)
    }
  }
}

// 辅助函数：生成朝代对比报告
async function generateDynastyReport(time_range: any, filters: any) {
  const { data } = await supabase
    .from('cases')
    .select('dynasty, interaction_method, case_category, official_strategy')
    .eq('is_verified', true)

  const dynastyGroups = data?.reduce((acc, item) => {
    if (!acc[item.dynasty]) {
      acc[item.dynasty] = []
    }
    acc[item.dynasty].push(item)
    return acc
  }, {} as Record<string, any[]>) || {}

  const dynastyAnalysis = Object.entries(dynastyGroups).map(([dynasty, cases]) => ({
    dynasty,
    case_count: cases.length,
    interaction_methods: analyzeDistribution(cases, 'interaction_method'),
    case_types: analyzeDistribution(cases, 'case_category'),
    strategies: analyzeDistribution(cases, 'official_strategy')
  }))

  return {
    dynasty_comparison: dynastyAnalysis,
    temporal_evolution: analyzeTemporalEvolution(dynastyGroups)
  }
}

// 辅助函数：生成互动方式报告
async function generateInteractionReport(time_range: any, filters: any) {
  const { data } = await supabase
    .from('cases')
    .select('interaction_method, case_category, official_strategy, dynasty')
    .eq('is_verified', true)

  return {
    interaction_distribution: analyzeDistribution(data, 'interaction_method'),
    interaction_effectiveness: analyzeInteractionEffectiveness(data),
    historical_evolution: analyzeInteractionEvolution(data)
  }
}

// 统计分析辅助函数
function analyzeDistribution(data: any[], field: string) {
  const distribution = data?.reduce((acc, item) => {
    const value = item[field]
    if (value) {
      acc[value] = (acc[value] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}

  return Object.entries(distribution).map(([key, count]) => ({
    name: key,
    count,
    percentage: ((count / (data?.length || 1)) * 100).toFixed(1)
  }))
}

function analyzeCorrelation(data: any[], group_by: string) {
  // 实现相关性分析逻辑
  return []
}

function analyzeTrend(data: any[], group_by: string) {
  // 实现趋势分析逻辑
  return []
}

function findMostCommonValue(data: any[], field: string) {
  const distribution = analyzeDistribution(data, field)
  return distribution.length > 0 ? distribution[0].name : null
}

function calculateAverageInteractionMethods(data: any[]) {
  // 实现平均互动方式计算
  return 0
}

function calculateVerifiedPercentage(data: any[]) {
  if (!data || data.length === 0) return 0
  const verified = data.filter(item => item.is_verified).length
  return ((verified / data.length) * 100).toFixed(1)
}

async function calculateAverageConfidenceScore(data: any[]) {
  if (!data || data.length === 0) return 0
  
  const caseIds = data.map(item => item.id)
  const { data: extractions } = await supabase
    .from('ai_extractions')
    .select('confidence_score')
    .in('case_id', caseIds)

  if (!extractions || extractions.length === 0) return 0
  
  const totalScore = extractions.reduce((sum, ext) => sum + (ext.confidence_score || 0), 0)
  return (totalScore / extractions.length).toFixed(3)
}

function analyzeInteractionEffectiveness(data: any[]) {
  // 实现互动方式有效性分析
  return {}
}

function analyzeInteractionEvolution(data: any[]) {
  // 实现互动方式演变分析
  return {}
}

function analyzeTemporalEvolution(dynastyGroups: Record<string, any[]>) {
  // 实现时间演变分析
  return {}
}

export default router