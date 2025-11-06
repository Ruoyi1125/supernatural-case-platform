import express from 'express'
import cors from 'cors'
import { AIService } from './services/aiService'
import { CaseService } from './services/caseService'

const app = express()
const port = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 初始化服务
const aiService = AIService.getInstance()
const caseService = CaseService.getInstance()

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// AI提取API
app.post('/api/ai/extract', async (req, res) => {
  try {
    const { raw_text } = req.body
    
    if (!raw_text || typeof raw_text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: '缺少原始文本参数' 
      })
    }
    
    const result = await aiService.extractCaseData({ raw_text })
    
    if (result.success && result.data) {
      // 自动保存提取的案例
      await caseService.createCase(result.data)
    }
    
    res.json(result)
  } catch (error) {
    console.error('AI提取错误:', error)
    res.status(500).json({ 
      success: false, 
      error: 'AI提取失败' 
    })
  }
})

// 获取所有案例
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await caseService.getAllCases()
    res.json({ success: true, data: cases })
  } catch (error) {
    console.error('获取案例错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '获取案例失败' 
    })
  }
})

// 搜索案例
app.get('/api/cases/search', async (req, res) => {
  try {
    const filters = {
      dynasty: req.query.dynasty as string,
      case_category: req.query.case_category as string,
      interaction_method: req.query.interaction_method as string,
      evidence_status: req.query.evidence_status as string,
      confidence_min: req.query.confidence_min ? parseFloat(req.query.confidence_min as string) : undefined,
      confidence_max: req.query.confidence_max ? parseFloat(req.query.confidence_max as string) : undefined
    }
    
    // 移除空值
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })
    
    const cases = await caseService.searchCases(filters)
    res.json({ success: true, data: cases })
  } catch (error) {
    console.error('搜索案例错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '搜索案例失败' 
    })
  }
})

// 获取单个案例
app.get('/api/cases/:id', async (req, res) => {
  try {
    const case_ = await caseService.getCaseById(req.params.id)
    
    if (!case_) {
      return res.status(404).json({ 
        success: false, 
        error: '案例不存在' 
      })
    }
    
    res.json({ success: true, data: case_ })
  } catch (error) {
    console.error('获取案例详情错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '获取案例详情失败' 
    })
  }
})

// 创建案例
app.post('/api/cases', async (req, res) => {
  try {
    const caseData = req.body
    const newCase = await caseService.createCase(caseData)
    res.json({ success: true, data: newCase })
  } catch (error) {
    console.error('创建案例错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '创建案例失败' 
    })
  }
})

// 更新案例
app.put('/api/cases/:id', async (req, res) => {
  try {
    const updatedCase = await caseService.updateCase(req.params.id, req.body)
    
    if (!updatedCase) {
      return res.status(404).json({ 
        success: false, 
        error: '案例不存在' 
      })
    }
    
    res.json({ success: true, data: updatedCase })
  } catch (error) {
    console.error('更新案例错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '更新案例失败' 
    })
  }
})

// 删除案例
app.delete('/api/cases/:id', async (req, res) => {
  try {
    const deleted = await caseService.deleteCase(req.params.id)
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: '案例不存在' 
      })
    }
    
    res.json({ success: true, message: '案例删除成功' })
  } catch (error) {
    console.error('删除案例错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '删除案例失败' 
    })
  }
})

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await caseService.getStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('获取统计错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '获取统计失败' 
    })
  }
})

// 获取关联分析数据
app.get('/api/analytics/correlations', async (req, res) => {
  try {
    const correlations = await caseService.getCorrelations()
    res.json({ success: true, data: correlations })
  } catch (error) {
    console.error('获取关联分析错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '获取关联分析失败' 
    })
  }
})

// 获取AI性能指标
app.get('/api/analytics/ai-performance', async (req, res) => {
  try {
    const performance = await caseService.getAIPerformance()
    res.json({ success: true, data: performance })
  } catch (error) {
    console.error('获取AI性能错误:', error)
    res.status(500).json({ 
      success: false, 
      error: '获取AI性能失败' 
    })
  }
})

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`)
  console.log(`API文档: http://localhost:${port}/api`)
})