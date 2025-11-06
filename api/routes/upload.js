import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabaseAdmin, TABLES } from '../config/supabase.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5 // 最多5个文件
  }
});

// 生成唯一文件名
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const ext = path.extname(originalName);
  return `${timestamp}_${random}${ext}`;
};

// 保存文件到本地
const saveFileToLocal = async (buffer, fileName) => {
  const filePath = path.join(uploadDir, fileName);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

// 上传头像
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = generateFileName(req.file.originalname);
    await saveFileToLocal(req.file.buffer, fileName);

    const avatarUrl = `${process.env.FILE_UPLOAD_URL || 'http://localhost:3001'}/uploads/${fileName}`;

    // 更新用户头像
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, name, avatar_url')
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ error: 'Failed to update avatar' });
    }

    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
      user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// 上传订单图片
router.post('/order/:orderId/images', upload.array('images', 5), async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // 检查订单是否存在且用户有权限
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户是否是订单的参与者
    if (order.creator_id !== userId && order.accepter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 保存所有文件
    const uploadedImages = [];
    for (const file of req.files) {
      const fileName = generateFileName(file.originalname);
      await saveFileToLocal(file.buffer, fileName);

      const imageUrl = `${process.env.FILE_UPLOAD_URL || 'http://localhost:3001'}/uploads/${fileName}`;

      // 保存图片记录到数据库
      const { data: imageRecord, error: imageError } = await supabaseAdmin
        .from(TABLES.ORDER_IMAGES)
        .insert({
          order_id: orderId,
          uploader_id: userId,
          image_url: imageUrl,
          original_name: file.originalname,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (imageError) {
        console.error('Save image record error:', imageError);
        continue;
      }

      uploadedImages.push(imageRecord);
    }

    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Upload order images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// 获取订单图片
router.get('/order/:orderId/images', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // 检查订单是否存在且用户有权限
    const { data: order, error: orderError } = await supabaseAdmin
      .from(TABLES.ORDERS)
      .select('id, creator_id, accepter_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 检查用户是否是订单的参与者
    if (order.creator_id !== userId && order.accepter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 获取订单图片
    const { data: images, error } = await supabaseAdmin
      .from(TABLES.ORDER_IMAGES)
      .select(`
        *,
        uploader:users!order_images_uploader_id_fkey(id, name, avatar_url)
      `)
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: true });

    if (error) {
      console.error('Get order images error:', error);
      return res.status(500).json({ error: 'Failed to get order images' });
    }

    res.json({ images });
  } catch (error) {
    console.error('Get order images error:', error);
    res.status(500).json({ error: 'Failed to get order images' });
  }
});

// 删除图片
router.delete('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.id;

    // 获取图片信息
    const { data: image, error: fetchError } = await supabaseAdmin
      .from(TABLES.ORDER_IMAGES)
      .select('id, uploader_id, image_url')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // 检查权限
    if (image.uploader_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only image uploader can delete the image' });
    }

    // 删除数据库记录
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.ORDER_IMAGES)
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Delete image record error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete image' });
    }

    // 删除本地文件
    try {
      const fileName = path.basename(image.image_url);
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (fileError) {
      console.error('Delete local file error:', fileError);
      // 不影响响应，文件删除失败不是致命错误
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// 通用文件上传
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = generateFileName(req.file.originalname);
    await saveFileToLocal(req.file.buffer, fileName);

    const fileUrl = `${process.env.FILE_UPLOAD_URL || 'http://localhost:3001'}/uploads/${fileName}`;

    res.json({
      message: 'File uploaded successfully',
      file_url: fileUrl,
      original_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// 获取上传统计
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户上传的图片统计
    const { data: userImages, error: userError } = await supabaseAdmin
      .from(TABLES.ORDER_IMAGES)
      .select('file_size')
      .eq('uploader_id', userId);

    if (userError) {
      console.error('Get upload stats error:', userError);
      return res.status(500).json({ error: 'Failed to get upload statistics' });
    }

    const userStats = {
      total_uploads: userImages.length,
      total_size: userImages.reduce((sum, img) => sum + (img.file_size || 0), 0)
    };

    // 如果是管理员，获取全局统计
    if (req.user.role === 'admin') {
      const { data: allImages, error: allError } = await supabaseAdmin
        .from(TABLES.ORDER_IMAGES)
        .select('file_size, uploaded_at');

      if (!allError) {
        userStats.global_stats = {
          total_uploads: allImages.length,
          total_size: allImages.reduce((sum, img) => sum + (img.file_size || 0), 0)
        };
      }
    }

    res.json({ stats: userStats });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({ error: 'Failed to get upload statistics' });
  }
});

export default router;