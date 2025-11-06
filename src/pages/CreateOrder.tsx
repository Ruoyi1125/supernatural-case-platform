import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, DollarSign, AlertCircle, Camera } from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { formatPrice } from '../utils'

const CreateOrder: React.FC = () => {
  const navigate = useNavigate()
  const { createOrder, isLoading, error, clearError } = useOrderStore()
  
  const [formData, setFormData] = useState({
    pickup_platform: '',
    pickup_location: {
      address: '',
      name: '',
      lng: 0,
      lat: 0
    },
    delivery_location: {
      address: '',
      name: '',
      lng: 0,
      lat: 0
    },
    base_fee: 5,
    urgent_fee: 0,
    special_requirements: '',
    is_urgent: false,
    pickup_time: ''
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1) // 1: 基本信息, 2: 地址信息, 3: 费用和备注

  // 确保step始终从1开始
  React.useEffect(() => {
    setStep(1)
  }, [])

  // 清除错误
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name === 'base_fee' || name === 'urgent_fee') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleLocationChange = (type: 'pickup' | 'delivery', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_location`]: {
        ...prev[`${type}_location` as keyof typeof prev] as any,
        [field]: value
      }
    }))
  }

  const validateStep = (stepNumber: number) => {
    const errors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.pickup_platform) {
        errors.pickup_platform = '请选择取餐平台'
      }
      if (formData.pickup_time && new Date(formData.pickup_time) <= new Date()) {
        errors.pickup_time = '取餐时间不能早于当前时间'
      }
    }

    if (stepNumber === 2) {
      if (!formData.pickup_location.address) {
        errors.pickup_address = '请输入取餐地址'
      }
      if (!formData.delivery_location.address) {
        errors.delivery_address = '请输入送达地址'
      }
    }

    if (stepNumber === 3) {
      if (formData.base_fee < 1) {
        errors.base_fee = '基础费用不能少于1元'
      }
      if (formData.is_urgent && formData.urgent_fee < 1) {
        errors.urgent_fee = '急单费用不能少于1元'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return
    }

    try {
      // 转换数据格式以匹配API期望的结构
      const orderData = {
        pickup_platform: formData.pickup_platform,
        pickup_location: formData.pickup_location.address || formData.pickup_location.name,
        delivery_location: formData.delivery_location.address || formData.delivery_location.name,
        base_fee: formData.base_fee,
        urgent_fee: formData.is_urgent ? formData.urgent_fee : 0,
        special_requirements: formData.special_requirements || undefined,
        is_urgent: formData.is_urgent,
        pickup_time: formData.pickup_time || undefined
      }
      
      const order = await createOrder(orderData)
      navigate(`/order/${order.id}`)
    } catch (err: any) {
      console.error('创建订单失败:', err)
      // 如果是认证错误，不需要额外处理，API拦截器会自动跳转到登录页
      if (err.message?.includes('401') || err.message?.includes('未授权') || err.message?.includes('token')) {
        return
      }
      // 其他错误会通过orderStore的error状态显示
    }
  }

  const totalFee = formData.base_fee + (formData.is_urgent ? formData.urgent_fee : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded-lg">
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

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600' : 'text-gray-500'}>基本信息</span>
            <span className={step >= 2 ? 'text-blue-600' : 'text-gray-500'}>地址信息</span>
            <span className={step >= 3 ? 'text-blue-600' : 'text-gray-500'}>费用设置</span>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 步骤 1: 基本信息 */}
          {step === 1 && (

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
              
              {/* 取餐平台 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  取餐平台 *
                </label>
                <select
                  name="pickup_platform"
                  value={formData.pickup_platform}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.pickup_platform ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">请选择取餐平台</option>
                  <option value="meituan">美团</option>
                  <option value="eleme">饿了么</option>
                  <option value="other">其他</option>
                </select>
                {formErrors.pickup_platform && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.pickup_platform}</p>
                )}
              </div>

              {/* 期望取餐时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期望取餐时间
                </label>
                <input
                  type="datetime-local"
                  name="pickup_time"
                  value={formData.pickup_time}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.pickup_time ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.pickup_time && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.pickup_time}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">不填写则表示尽快取餐</p>
              </div>

              {/* 是否急单 */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_urgent"
                    checked={formData.is_urgent}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    急单（需要额外支付急单费用）
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 步骤 2: 地址信息 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">地址信息</h2>
              
              {/* 取餐地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  取餐地址 *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.pickup_location.address}
                    onChange={(e) => handleLocationChange('pickup', 'address', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.pickup_address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="请输入取餐地址"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                {formErrors.pickup_address && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.pickup_address}</p>
                )}
              </div>

              {/* 商家名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商家名称
                </label>
                <input
                  type="text"
                  value={formData.pickup_location.name}
                  onChange={(e) => handleLocationChange('pickup', 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入商家名称"
                />
              </div>

              {/* 送达地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送达地址 *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.delivery_location.address}
                    onChange={(e) => handleLocationChange('delivery', 'address', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.delivery_address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="请输入送达地址"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                {formErrors.delivery_address && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.delivery_address}</p>
                )}
              </div>
            </div>
          )}

          {/* 步骤 3: 费用和备注 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">费用设置</h2>
              
              {/* 基础费用 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基础费用 *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="base_fee"
                    value={formData.base_fee}
                    onChange={handleInputChange}
                    min="1"
                    step="0.5"
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.base_fee ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.base_fee && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.base_fee}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">建议费用：3-8元</p>
              </div>

              {/* 急单费用 */}
              {formData.is_urgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    急单费用 *
                  </label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400" />
                    <input
                      type="number"
                      name="urgent_fee"
                      value={formData.urgent_fee}
                      onChange={handleInputChange}
                      min="1"
                      step="0.5"
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.urgent_fee ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {formErrors.urgent_fee && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.urgent_fee}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">急单额外费用，建议2-5元</p>
                </div>
              )}

              {/* 特殊要求 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  特殊要求
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入特殊要求，如：需要餐具、不要辣椒等"
                />
              </div>

              {/* 费用总计 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">总费用</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(totalFee)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>基础费用</span>
                    <span>{formatPrice(formData.base_fee)}</span>
                  </div>
                  {formData.is_urgent && (
                    <div className="flex justify-between">
                      <span>急单费用</span>
                      <span>{formatPrice(formData.urgent_fee)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      发布中...
                    </div>
                  ) : (
                    '发布订单'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateOrder