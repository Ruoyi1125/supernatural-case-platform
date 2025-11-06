import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar, Award, BookOpen, Settings, Save, Edit3 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  joinDate: string
  avatar?: string
  bio?: string
  researchInterests: string[]
  stats: {
    casesContributed: number
    aiProcessed: number
    researchHours: number
  }
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载用户数据
    setTimeout(() => {
      const mockProfile: UserProfile = {
        id: '1',
        name: '张研究员',
        email: 'researcher@example.com',
        role: '高级研究员',
        joinDate: '2023-06-15',
        bio: '专注于中国古代司法制度与超自然现象的关系研究，对宋明时期的司法案例有深入研究。',
        researchInterests: ['宋代司法', '超自然现象', '司法制度史', '民间信仰'],
        stats: {
          casesContributed: 156,
          aiProcessed: 89,
          researchHours: 234
        }
      }
      setProfile(mockProfile)
      setEditedProfile(mockProfile)
      setLoading(false)
    }, 1000)
  }, [])

  const handleSave = () => {
    if (editedProfile) {
      setProfile(editedProfile)
      setIsEditing(false)
      // 这里可以添加保存到后端的逻辑
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const addResearchInterest = (interest: string) => {
    if (editedProfile && interest.trim() && !editedProfile.researchInterests.includes(interest.trim())) {
      setEditedProfile({
        ...editedProfile,
        researchInterests: [...editedProfile.researchInterests, interest.trim()]
      })
    }
  }

  const removeResearchInterest = (interest: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        researchInterests: editedProfile.researchInterests.filter(i => i !== interest)
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载用户信息中...</p>
        </div>
      </div>
    )
  }

  if (!profile || !editedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">用户不存在</h3>
          <p className="text-gray-600">请重新登录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">个人中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  编辑资料
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    className="text-xl font-semibold text-center border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                )}
                <p className="text-gray-600 mt-1">{profile.role}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{profile.email}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>加入时间：{new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* 个人简介 */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">个人简介</h3>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="介绍一下您的研究兴趣和背景..."
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {profile.bio || '暂无个人简介'}
                  </p>
                )}
              </div>
            </div>

            {/* 研究兴趣 */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">研究兴趣</h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editedProfile.researchInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {interest}
                        <button
                          onClick={() => removeResearchInterest(interest)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="添加研究兴趣（按回车添加）"
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addResearchInterest(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.researchInterests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：统计信息和活动 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">贡献案例</p>
                    <p className="text-3xl font-bold text-gray-900">{profile.stats.casesContributed}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI处理</p>
                    <p className="text-3xl font-bold text-gray-900">{profile.stats.aiProcessed}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">研究时长</p>
                    <p className="text-3xl font-bold text-gray-900">{profile.stats.researchHours}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">上传了新的案例《明代冤魂告状案》</p>
                    <p className="text-xs text-gray-500">2小时前</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">使用AI处理了《清代托梦断案》</p>
                    <p className="text-xs text-gray-500">1天前</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">完成了数据分析报告《宋代司法中的超自然现象》</p>
                    <p className="text-xs text-gray-500">3天前</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">参与了《元代神明裁决案例》的讨论</p>
                    <p className="text-xs text-gray-500">5天前</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 成就徽章 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">成就徽章</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-xs text-gray-600">案例贡献者</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">研究学者</p>
                </div>

                <div className="text-center opacity-50">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">AI专家</p>
                </div>

                <div className="text-center opacity-50">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">数据分析师</p>
                </div>
              </div>
            </div>
          </div>
        </div>