import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../../uploads')
const avatarsDir = path.join(uploadsDir, 'avatars')
const messagesDir = path.join(uploadsDir, 'messages')

// 创建目录
[uploadsDir, avatarsDir, messagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// 配置 multer
const storage = multer.memoryStorage()

const fileFilter = (req: any, file: any, cb: any) => {
  // 检查文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型。只支持 JPEG, PNG, GIF, WebP 格式的图片'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
})

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = path.extname(originalName).toLowerCase()
  return `${timestamp}_${random}${ext}`
}

// 保存文件到磁盘
const saveFile = (buffer: Buffer, fileName: string, subDir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadsDir, subDir, fileName)
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(`/uploads/${subDir}/${fileName}`)
      }
    })
  })
}

// 上传头像
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '未选择文件',
        message: '请选择要上传的头像文件'
      })
    }

    // 验证文件大小
    if (req.file.size > 2 * 1024 * 1024) { // 2MB
      return res.status(400).json({
        error: '文件太大',
        message: '头像文件大小不能超过2MB'
      })
    }

    // 生成文件名
    const fileName = generateFileName(req.file.originalname)

    try {
      // 保存文件
      const fileUrl = await saveFile(req.file.buffer, fileName, 'avatars')

      // 构建完整的URL
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const fullUrl = `${baseUrl}${fileUrl}`

      res.json({
        message: '头像上传成功',
        url: fullUrl,
        filename: fileName
      })

    } catch (saveError) {
      console.error('Save avatar error:', saveError)
      res.status(500).json({
        error: '保存文件失败',
        message: '文件保存过程中发生错误'
      })
    }

  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '上传头像过程中发生错误'
    })
  }
})

// 上传消息图片
router.post('/message', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '未选择文件',
        message: '请选择要上传的图片文件'
      })
    }

    // 验证文件大小
    if (req.file.size > 5 * 1024 * 1024) { // 5MB
      return res.status(400).json({
        error: '文件太大',
        message: '图片文件大小不能超过5MB'
      })
    }

    // 生成文件名
    const fileName = generateFileName(req.file.originalname)

    try {
      // 保存文件
      const fileUrl = await saveFile(req.file.buffer, fileName, 'messages')

      // 构建完整的URL
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const fullUrl = `${baseUrl}${fileUrl}`

      res.json({
        message: '图片上传成功',
        url: fullUrl,
        filename: fileName
      })

    } catch (saveError) {
      console.error('Save message image error:', saveError)
      res.status(500).json({
        error: '保存文件失败',
        message: '文件保存过程中发生错误'
      })
    }

  } catch (error) {
    console.error('Upload message image error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '上传图片过程中发生错误'
    })
  }
})

// 批量上传图片
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        error: '未选择文件',
        message: '请选择要上传的图片文件'
      })
    }

    const uploadPromises = req.files.map(async (file) => {
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error(`文件 ${file.originalname} 太大，不能超过5MB`)
      }

      // 生成文件名
      const fileName = generateFileName(file.originalname)

      // 保存文件
      const fileUrl = await saveFile(file.buffer, fileName, 'messages')

      // 构建完整的URL
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const fullUrl = `${baseUrl}${fileUrl}`

      return {
        originalName: file.originalname,
        filename: fileName,
        url: fullUrl,
        size: file.size
      }
    })

    try {
      const uploadedFiles = await Promise.all(uploadPromises)

      res.json({
        message: '图片上传成功',
        files: uploadedFiles
      })

    } catch (uploadError) {
      console.error('Batch upload error:', uploadError)
      res.status(400).json({
        error: '上传失败',
        message: uploadError instanceof Error ? uploadError.message : '批量上传过程中发生错误'
      })
    }

  } catch (error) {
    console.error('Batch upload error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '批量上传过程中发生错误'
    })
  }
})

// 删除文件
router.delete('/:type/:filename', authenticateToken, async (req, res) => {
  try {
    const { type, filename } = req.params

    // 验证文件类型
    const validTypes = ['avatars', 'messages']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: '无效的文件类型',
        message: '文件类型必须是: ' + validTypes.join(', ')
      })
    }

    // 验证文件名格式（防止路径遍历攻击）
    if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return res.status(400).json({
        error: '无效的文件名',
        message: '文件名格式不正确'
      })
    }

    const filePath = path.join(uploadsDir, type, filename)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: '文件不存在',
        message: '要删除的文件不存在'
      })
    }

    // 删除文件
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Delete file error:', err)
        return res.status(500).json({
          error: '删除文件失败',
          message: '文件删除过程中发生错误'
        })
      }

      res.json({
        message: '文件删除成功'
      })
    })

  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '删除文件过程中发生错误'
    })
  }
})

// 获取文件信息
router.get('/info/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params

    // 验证文件类型
    const validTypes = ['avatars', 'messages']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: '无效的文件类型',
        message: '文件类型必须是: ' + validTypes.join(', ')
      })
    }

    // 验证文件名格式
    if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
      return res.status(400).json({
        error: '无效的文件名',
        message: '文件名格式不正确'
      })
    }

    const filePath = path.join(uploadsDir, type, filename)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: '文件不存在',
        message: '指定的文件不存在'
      })
    }

    // 获取文件信息
    const stats = fs.statSync(filePath)
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`

    res.json({
      filename,
      type,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `${baseUrl}/uploads/${type}/${filename}`
    })

  } catch (error) {
    console.error('Get file info error:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取文件信息失败'
    })
  }
})

// 错误处理中间件
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: '文件太大',
        message: '上传的文件超过了大小限制'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: '文件数量超限',
        message: '上传的文件数量超过了限制'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: '意外的文件字段',
        message: '上传的文件字段名不正确'
      })
    }
  }

  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      error: '文件类型不支持',
      message: error.message
    })
  }

  console.error('Upload error:', error)
  res.status(500).json({
    error: '上传失败',
    message: '文件上传过程中发生错误'
  })
})

export default router