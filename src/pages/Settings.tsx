import React, { useState } from 'react'
import { Bell, Shield, Palette, Globe, Save, User, Key, Database } from 'lucide-react'

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'appearance'>('general')
  const [settings, setSettings] = useState({
    // 通用设置
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    
    // 安全设置
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: 30,
    
    // 通知设置
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    caseUpdates: true,
    aiAnalysisComplete: true,
    
    // 外观设置
    theme: 'light',
    compactMode: false,
    showStats: true
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // 模拟保存设置
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    
    // 这里可以添加实际保存到后端的逻辑
    localStorage.setItem('userSettings', JSON.stringify(settings))
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const tabs = [
    { id: 'general', name: '通用', icon: Globe },
    { id: 'security', name: '安全', icon: Shield },
    { id: 'notifications', name: '通知', icon: Bell },
    { id: 'appearance', name: '外观', icon: Palette }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">设置</h1>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              保存更改
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧导航 */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-3" />
                        {tab.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {saved && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">设置已保存</p>
              </div>
            )}
          </div>

          {/* 右侧内容 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {/* 通用设置 */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">通用设置</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语言
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="zh-TW">繁體中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      时区
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                      <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
                      <option value="America/New_York">纽约时间 (UTC-5)</option>
                      <option value="Europe/London">伦敦时间 (UTC+0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      日期格式
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="YYYY-MM-DD">2024-01-15</option>
                      <option value="DD/MM/YYYY">15/01/2024</option>
                      <option value="MM/DD/YYYY">01/15/2024</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 安全设置 */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">安全设置</h3>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">两步验证</h4>
                      <p className="text-sm text-gray-500">使用手机验证码增强账户安全</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">登录通知</h4>
                      <p className="text-sm text-gray-500">在新设备登录时发送邮件通知</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('loginNotifications', !settings.loginNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.loginNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      会话超时时间（分钟）
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">设置自动登出的时间间隔</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Key className="h-4 w-4 mr-2" />
                      修改密码
                    </button>
                  </div>
                </div>
              )}

              {/* 通知设置 */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">通知设置</h3>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">邮件通知</h4>
                      <p className="text-sm text-gray-500">接收重要更新和提醒邮件</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">推送通知</h4>
                      <p className="text-sm text-gray-500">在浏览器中接收实时通知</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">通知类型</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">周报摘要</span>
                        <button
                          onClick={() => handleSettingChange('weeklyDigest', !settings.weeklyDigest)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.weeklyDigest ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">案例更新</span>
                        <button
                          onClick={() => handleSettingChange('caseUpdates', !settings.caseUpdates)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.caseUpdates ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.caseUpdates ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">AI分析完成</span>
                        <button
                          onClick={() => handleSettingChange('aiAnalysisComplete', !settings.aiAnalysisComplete)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.aiAnalysisComplete ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.aiAnalysisComplete ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 外观设置 */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">外观设置</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      主题
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => handleSettingChange('theme', 'light')}
                        className={`p-4 border rounded-lg text-center ${
                          settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded mx-auto mb-2"></div>
                        <span className="text-sm">浅色</span>
                      </button>
                      
                      <button
                        onClick={() => handleSettingChange('theme', 'dark')}
                        className={`p-4 border rounded-lg text-center ${
                          settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-800 rounded mx-auto mb-2"></div>
                        <span className="text-sm">深色</span>
                      </button>
                      
                      <button
                        onClick={() => handleSettingChange('theme', 'auto')}
                        className={`p-4 border rounded-lg text-center ${
                          settings.theme === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-800 rounded mx-auto mb-2"></div>
                        <span className="text-sm">自动</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">紧凑模式</h4>
                      <p className="text-sm text-gray-500">减少界面元素间距，显示更多内容</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">显示统计信息</h4>
                      <p className="text-sm text-gray-500">在仪表板显示详细统计数据</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('showStats', !settings.showStats)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showStats ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showStats ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings