import express, { Request, Response, NextFunction } from 'express'
import OpenAI from 'openai'
import { supabase } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AI结构化提取接口
router.post('/extract', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, extraction_type = 'complete' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: '文本内容不能为空'
      })
    }

    const startTime = Date.now()

    // 构建AI提示词
    const systemPrompt = `你是一个专业的中国古代司法史研究专家，擅长从古代文献中提取超自然司法案例的结构化信息。

请根据提供的古代案例文本，提取以下结构化信息：

1. 案例名称：简洁准确地描述案例
2. 朝代：案例发生的朝代
3. 年份：具体年份或朝代年号
4. 地点：案例发生的地理位置
5. 核心案情：案件的基本事实和经过
6. 鬼魂互动方式：托梦、显形、附体、异象、无形感应
7. 司法功能：伸冤、证据获取、真相揭露、调解纠纷、执行正义
8. 官员应对策略：验证型、借力型、规避型
9. 案件类型：谋杀、冤狱、财产纠纷、田土争议、通奸
10. 证据状态：无头案、证据链残缺、证据充足

请以JSON格式返回提取的信息，确保信息准确完整。`

    const userPrompt = `请从以下古代案例文本中提取结构化信息：

${text}

请按照系统提示的要求，提取所有相关的结构化信息。`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('AI返回内容为空')
    }

    // 解析AI返回的JSON
    let extractedData
    try {
      extractedData = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('AI返回JSON解析失败:', aiResponse)
      throw new Error('AI返回格式错误')
    }

    const processingTime = Date.now() - startTime

    // 计算置信度分数（基于返回字段的完整性）
    const requiredFields = [
      '案例名称', '朝代', '核心案情', '鬼魂互动方式', 
      '司法功能', '官员应对策略', '案件类型', '证据状态'
    ]
    
    const filledFields = requiredFields.filter(field => extractedData[field] && extractedData[field] !== '未知')
    const confidenceScore = filledFields.length / requiredFields.length

    res.json({
      success: true,
      extracted_data: extractedData,
      confidence_score: confidenceScore,
      processing_time: processingTime,
      model_used: 'gpt-4-turbo'
    })

  } catch (error) {
    console.error('AI提取失败:', error)
    next(error)
  }
})

// 智能查询分析接口
router.post('/analyze', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, analysis_type = 'summary' } = req.body

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '查询内容不能为空'
      })
    }

    const startTime = Date.now()

    // 根据分析类型构建不同的AI提示词
    let systemPrompt = ''
    let userPrompt = ''

    switch (analysis_type) {
      case 'summary':
        systemPrompt = `你是一个中国古代司法史专家，擅长对超自然司法案例进行智能分析和总结。

请根据用户的查询，从数据库中搜索相关案例，并提供智能分析和总结。分析应包括：
1. 相关案例数量和基本情况
2. 主要特征和模式
3. 历史意义和研究价值
4. 推荐的进一步研究方向`
        
        userPrompt = `请分析以下查询相关的超自然司法案例：${query}

请提供详细的分析报告，包括案例特征、历史背景和研究价值。`
        break

      case 'statistical':
        systemPrompt = `你是一个数据分析专家，擅长对超自然司法案例进行统计分析。

请根据用户的查询，提供相关的统计数据和分析，包括：
1. 数量分布统计
2. 时间趋势分析  
3. 类别分布情况
4. 特征关联分析`
        
        userPrompt = `请对以下查询进行统计分析：${query}

请提供详细的统计数据和可视化建议。`
        break

      case 'comparative':
        systemPrompt = `你是一个比较研究专家，擅长对不同时期、地区的超自然司法案例进行对比分析。

请根据用户的查询，提供对比分析报告，包括：
1. 不同时期的特点对比
2. 不同地区的差异分析
3. 演变趋势和原因
4. 影响因素分析`
        
        userPrompt = `请对比分析以下查询相关的超自然司法案例：${query}

请提供详细的对比分析报告。`
        break

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的分析类型'
        })
    }

    // 首先从数据库搜索相关案例
    const { data: cases } = await supabase
      .from('cases')
      .select('*')
      .or(`case_name.ilike.%${query}%,core_facts.ilike.%${query}%,dynasty.ilike.%${query}%`)
      .limit(50)

    // 构建AI分析的上下文信息
    const contextData = {
      total_cases: cases?.length || 0,
      cases: cases?.map(c => ({
        case_name: c.case_name,
        dynasty: c.dynasty,
        interaction_method: c.interaction_method,
        case_category: c.case_category,
        official_strategy: c.official_strategy,
        core_facts: c.core_facts.substring(0, 200) + '...'
      })) || []
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `${userPrompt}\n\n相关数据：\n${JSON.stringify(contextData, null, 2)}` 
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    })

    const analysisResult = completion.choices[0]?.message?.content
    if (!analysisResult) {
      throw new Error('AI分析返回内容为空')
    }

    const processingTime = Date.now() - startTime

    // 保存分析记录
    await supabase.from('analytics').insert({
      user_id: req.user.id,
      analysis_type,
      parameters: { query, analysis_type },
      results: {
        analysis_result: analysisResult,
        context_data: contextData,
        processing_time: processingTime
      }
    })

    res.json({
      success: true,
      analysis_result: analysisResult,
      context_data: contextData,
      processing_time: processingTime,
      model_used: 'gpt-4-turbo'
    })

  } catch (error) {
    console.error('AI分析失败:', error)
    next(error)
  }
})

// 批量AI处理接口
router.post('/batch-process', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { texts } = req.body

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本数组'
      })
    }

    if (texts.length > 10) {
      return res.status(400).json({
        success: false,
        error: '单次批量处理不能超过10个文本'
      })
    }

    const results = []
    
    for (const text of texts) {
      try {
        // 调用AI提取接口
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/ai/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify({ text })
        })

        if (response.ok) {
          const result = await response.json()
          results.push({
            text: text.substring(0, 100) + '...',
            success: true,
            data: result
          })
        } else {
          results.push({
            text: text.substring(0, 100) + '...',
            success: false,
            error: 'AI处理失败'
          })
        }
      } catch (error) {
        results.push({
          text: text.substring(0, 100) + '...',
          success: false,
          error: error.message
        })
      }
    }

    res.json({
      success: true,
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error('批量AI处理失败:', error)
    next(error)
  }
})

export default router