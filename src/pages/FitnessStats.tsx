import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, Target, Flame, Clock, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const FitnessStats: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // 模拟数据
  const weeklyData = [
    { day: '周一', calories: 320, punches: 450, time: 25 },
    { day: '周二', calories: 280, punches: 380, time: 20 },
    { day: '周三', calories: 420, punches: 520, time: 35 },
    { day: '周四', calories: 380, punches: 480, time: 30 },
    { day: '周五', calories: 450, punches: 580, time: 40 },
    { day: '周六', calories: 520, punches: 650, time: 45 },
    { day: '周日', calories: 380, punches: 480, time: 32 }
  ];

  const punchTypeData = [
    { name: '直拳', value: 45, color: '#f97316' },
    { name: '勾拳', value: 30, color: '#3b82f6' },
    { name: '上勾拳', value: 15, color: '#10b981' },
    { name: '组合拳', value: 10, color: '#8b5cf6' }
  ];

  const totalStats = {
    totalCalories: 2750,
    totalPunches: 3540,
    totalTime: 227,
    avgCaloriesPerDay: 393,
    bestDay: '周六',
    streak: 7
  };

  const achievements = [
    { title: '连续锻炼7天', completed: true, icon: '🔥' },
    { title: '单日消耗500卡路里', completed: true, icon: '💪' },
    { title: '累计1000次拳击', completed: true, icon: '👊' },
    { title: '连续锻炼30天', completed: false, icon: '🏆' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-orange-100">
      {/* 头部导航 */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回主菜单</span>
        </button>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <span className="text-lg font-semibold text-gray-700">锻炼数据</span>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* 时间段选择 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {period === 'week' ? '本周' : period === 'month' ? '本月' : '本年'}
              </button>
            ))}
          </div>
        </div>

        {/* 总览统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总卡路里</p>
                <p className="text-2xl font-bold text-orange-600">{totalStats.totalCalories}</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总拳击数</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.totalPunches}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总时长</p>
                <p className="text-2xl font-bold text-green-600">{Math.floor(totalStats.totalTime / 60)}h {totalStats.totalTime % 60}m</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">连续天数</p>
                <p className="text-2xl font-bold text-purple-600">{totalStats.streak}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 卡路里趋势图 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">卡路里消耗趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 拳击次数柱状图 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">每日拳击次数</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="punches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 拳击类型分布和成就 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 拳击类型分布 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">拳击类型分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={punchTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {punchTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 成就系统预览 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">最近成就</h3>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    achievement.completed
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      achievement.completed ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {achievement.title}
                    </p>
                  </div>
                  {achievement.completed && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate('/achievements')}
                className="w-full mt-4 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                查看所有成就
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessStats;