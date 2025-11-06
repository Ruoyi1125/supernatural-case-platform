import express, { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 创建新案例
router.post('/create', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { raw_text, source, metadata = {} } = req.body
    
    if (!raw_text) {
      return res.status(400).json({
        success: false,
        error: '原始案例文本不能为空'
      })
    }

    // 调用AI提取服务进行结构化提取
    const aiExtractResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/ai/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        text: raw_text,
        extraction_type: 'complete'
      })
    })

    let structuredData = {}
    let confidenceScore = 0

    if (aiExtractResponse.ok) {
      const aiResult = await aiExtractResponse.json()
      if (aiResult.success) {
        structuredData = aiResult.extracted_data
        confidenceScore = aiResult.confidence_score || 0
      }
    }

    // 创建案例记录
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .insert({
        user_id: req.user.id,
        case_name: structuredData['案例名称'] || '未命名案例',
        dynasty: structuredData['朝代'] || '未知',
        year: structuredData['年份'] || '',
        location: structuredData['地点'] || '',
        core_facts: structuredData['核心案情'] || raw_text.substring(0, 500),
        interaction_method: structuredData['鬼魂互动方式'] || '未知',
        judicial_functions: structuredData['司法功能'] ? JSON.stringify(structuredData['司法功能']) : '[]',
        official_strategy: structuredData['官员应对策略'] || '未知',
        case_category: structuredData['案件类型'] || '其他',
        evidence_status: structuredData['证据状态'] || '无头案',
        source_id: source || null,
        raw_text,
        structured_data: structuredData,
        is_verified: false
      })
      .select()
      .single()

    if (caseError) {
      throw caseError
    }

    // 记录AI提取结果
    if (aiExtractResponse.ok && confidenceScore > 0) {
      await supabase.from('ai_extractions').insert({
        case_id: caseData.id,
        extracted_data: structuredData,
        confidence_score: confidenceScore,
        model_used: 'gpt-4-turbo',
        processing_metadata: {
          extraction_type: 'complete',
          processing_time: Date.now()
        }
      })
    }

    res.json({
      success: true,
      case_id: caseData.id,
      structured_data: structuredData,
      confidence_score: confidenceScore,
      message: '案例创建成功，AI结构化提取完成'
    })

  } catch (error) {
    next(error)
  }
})

// 查询案例列表
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      keyword,
      dynasty,
      interaction_type,
      case_type,
      page = 1,
      limit = 20
    } = req.query

    let query = supabase
      .from('cases')
      .select(`
        *,
        literature_sources(title, author, dynasty as source_dynasty)
      `)
      .order('created_at', { ascending: false })

    // 构建查询条件
    if (keyword) {
      query = query.or(`case_name.ilike.%${keyword}%,core_facts.ilike.%${keyword}%,location.ilike.%${keyword}%`)
    }

    if (dynasty) {
      query = query.eq('dynasty', dynasty)
    }

    if (interaction_type) {
      query = query.eq('interaction_method', interaction_type)
    }

    if (case_type) {
      query = query.eq('case_category', case_type)
    }

    // 分页
    const start = (Number(page) - 1) * Number(limit)
    const end = start + Number(limit) - 1

    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    })

  } catch (error) {
    next(error)
  }
})

// 获取案例详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        literature_sources(title, author, dynasty, category),
        ai_extractions(extracted_data, confidence_score, model_used, created_at)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: '案例不存在'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })

  } catch (error) {
    next(error)
  }
})

// 更新案例
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 验证用户权限
    const { data: existingCase } = await supabase
      .from('cases')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      })
    }

    // 检查权限（用户只能修改自己的案例，管理员可以修改所有案例）
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (existingCase.user_id !== req.user.id && userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权修改此案例'
      })
    }

    const { data, error } = await supabase
      .from('cases')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data,
      message: '案例更新成功'
    })

  } catch (error) {
    next(error)
  }
})

// 删除案例
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // 验证用户权限（类似更新逻辑）
    const { data: existingCase } = await supabase
      .from('cases')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (existingCase.user_id !== req.user.id && userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权删除此案例'
      })
    }

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    res.json({
      success: true,
      message: '案例删除成功'
    })

  } catch (error) {
    next(error)
  }
})

export default router