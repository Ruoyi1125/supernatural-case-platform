import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Send, 
  Image as ImageIcon, 
  User, 
  Package, 
  MapPin, 
  Clock,
  X,
  Download,
  ArrowLeft
} from 'lucide-react'
import { useMessageStore } from '../stores/messageStore'
import { useAuthStore } from '../stores/authStore'
import { formatTime } from '../utils'

const MessageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    currentConversation,
    messages,
    getConversationById,
    getMessages,
    sendMessage,
    markAsRead,
    isLoading,
    error,
    clearError
  } = useMessageStore()

  const [messageText, setMessageText] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      loadConversationData()
    }
  }, [id])

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  useEffect(() => {
    // 滚动到底部
    scrollToBottom()
  }, [messages])

  const loadConversationData = async () => {
    if (!id) return
    
    try {
      // 获取对话信息
      await getConversationById(id)
      // 获取消息列表
      await getMessages(id)
      // 标记为已读
      await markAsRead(id)
    } catch (err) {
      console.error('加载对话数据失败:', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // 检查文件类型和数量
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== files.length) {
      alert('只能选择图片文件')
      return
    }

    if (selectedImages.length + imageFiles.length > 9) {
      alert('最多只能选择9张图片')
      return
    }

    // 检查文件大小
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('图片大小不能超过10MB')
      return
    }

    // 生成预览
    const newPreviews: string[] = []
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === imageFiles.length) {
          setPreviewImages(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setSelectedImages(prev => [...prev, ...imageFiles])
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    if (!id || (!messageText.trim() && selectedImages.length === 0)) return

    setIsSending(true)
    try {
      if (selectedImages.length > 0) {
        // 发送图片消息
        await sendMessage(id, '', 'image', selectedImages)
        setSelectedImages([])
        setPreviewImages([])
      }
      
      if (messageText.trim()) {
        // 发送文本消息
        await sendMessage(id, messageText.trim(), 'text')
        setMessageText('')
      }

      // 重新获取消息列表
      await getMessages(id)
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl)
    setShowImageModal(true)
  }

  const handleOrderClick = () => {
    if (currentConversation?.order_id) {
      navigate(`/order/${currentConversation.order_id}`)
    }
  }

  const renderMessage = (message: any) => {
    const isOwn = message.sender_id === user?.id
    const isSystem = message.message_type === 'system'

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {message.content}
          </div>
        </div>
      )
    }

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {/* 消息气泡 */}
          <div className={`px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            {message.message_type === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            {message.message_type === 'image' && message.image_urls && (
              <div className="space-y-2">
                {message.image_urls.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt="消息图片"
                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(url)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* 时间戳 */}
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.created_at)}
          </div>
        </div>

        {/* 头像 */}
        {!isOwn && (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2 order-0 flex-shrink-0">
            {currentConversation?.other_user?.avatar_url ? (
              <img
                src={currentConversation.other_user.avatar_url}
                alt="头像"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading && !currentConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!currentConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">对话不存在</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回消息列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 对话头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {currentConversation.other_user?.avatar_url ? (
              <img
                src={currentConversation.other_user.avatar_url}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentConversation.other_user?.name || '未知用户'}
            </h2>
            <p className="text-sm text-gray-500">
              {currentConversation.other_user?.student_id}
            </p>
          </div>
        </div>

        {/* 订单信息 */}
        {currentConversation.order && (
          <button
            onClick={handleOrderClick}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span className="text-sm">查看订单</span>
          </button>
        )}
      </div>

      {/* 订单卡片 */}
      {currentConversation.order && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">相关订单</span>
              <span className="text-sm text-blue-600">
                ¥{currentConversation.order.base_fee + (currentConversation.order.urgent_fee || 0)}
              </span>
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-green-500" />
                <span className="truncate">
                  {currentConversation.order.pickup_location?.name || '取餐地址'}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-red-500" />
                <span className="truncate">
                  {currentConversation.order.delivery_location?.address || '送达地址'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* 图片预览 */}
      {previewImages.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={preview}
                  alt="预览"
                  className="w-16 h-16 object-cover rounded border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          {/* 图片按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          
          {/* 文本输入 */}
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              placeholder="输入消息..."
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          {/* 发送按钮 */}
          <button
            onClick={handleSendMessage}
            disabled={isSending || (!messageText.trim() && selectedImages.length === 0)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* 图片查看模态框 */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={modalImageUrl}
              alt="查看图片"
              className="max-w-full max-h-full object-contain"
            />
            
            <a
              href={modalImageUrl}
              download
              className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageDetail