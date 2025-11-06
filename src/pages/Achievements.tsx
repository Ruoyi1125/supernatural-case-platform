import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock, CheckCircle, Target, Flame, Zap, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'fitness' | 'combat' | 'exploration' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: string;
  points: number;
}

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fitness' | 'combat' | 'exploration' | 'special'>('all');

  const achievements: Achievement[] = [
    // 健身类成就
    {
      id: '1',
      title: '初出茅庐',
      description: '完成第一次拳击训练',
      icon: '👊',
      category: 'fitness',
      difficulty: 'easy',
      progress: 1,
      maxProgress: 1,
      completed: true,
      reward: '经验值 +50',
      points: 10
    },
    {
      id: '2',
      title: '燃烧卡路里',
      description: '单次训练消耗500卡路里',
      icon: '🔥',
      category: 'fitness',
      difficulty: 'medium',
      progress: 450,
      maxProgress: 500,
      completed: false,
      reward: '新拳套皮肤',
      points: 25
    },
    {
      id: '3',
      title: '马拉松战士',
      description: '连续训练60分钟',
      icon: '⏰',
      category: 'fitness',
      difficulty: 'hard',
      progress: 35,
      maxProgress: 60,
      completed: false,
      reward: '耐力提升 +10%',
      points: 50
    },
    {
      id: '4',
      title: '健身达人',
      description: '连续锻炼30天',
      icon: '📅',
      category: 'fitness',
      difficulty: 'legendary',
      progress: 7,
      maxProgress: 30,
      completed: false,
      reward: '专属称号：健身大师',
      points: 100
    },

    // 战斗类成就
    {
      id: '5',
      title: '连击高手',
      description: '达成50连击',
      icon: '⚡',
      category: 'combat',
      difficulty: 'medium',
      progress: 32,
      maxProgress: 50,
      completed: false,
      reward: '连击特效',
      points: 30
    },
    {
      id: '6',
      title: '完美格挡',
      description: '连续格挡10次攻击',
      icon: '🛡️',
      category: 'combat',
      difficulty: 'hard',
      progress: 6,
      maxProgress: 10,
      completed: false,
      reward: '防御力 +15%',
      points: 40
    },
    {
      id: '7',
      title: '拳击大师',
      description: '击败100个训练靶',
      icon: '🥊',
      category: 'combat',
      difficulty: 'hard',
      progress: 78,
      maxProgress: 100,
      completed: false,
      reward: '大师拳套',
      points: 60
    },

    // 探索类成就
    {
      id: '8',
      title: '世界探索者',
      description: '探索所有训练场地',
      icon: '🗺️',
      category: 'exploration',
      difficulty: 'medium',
      progress: 3,
      maxProgress: 5,
      completed: false,
      reward: '新场景解锁',
      points: 35
    },
    {
      id: '9',
      title: '隐藏宝藏',
      description: '发现所有隐藏道具',
      icon: '💎',
      category: 'exploration',
      difficulty: 'hard',
      progress: 2,
      maxProgress: 8,
      completed: false,
      reward: '稀有装备',
      points: 45
    },

    // 特殊成就
    {
      id: '10',
      title: '完美主义者',
      description: '获得所有其他成就',
      icon: '👑',
      category: 'special',
      difficulty: 'legendary',
      progress: 1,
      maxProgress: 9,
      completed: false,
      reward: '终极称号：拳击之王',
      points: 200
    }
  ];

  const categories = [
    { key: 'all', label: '全部', icon: Trophy },
    { key: 'fitness', label: '健身', icon: Flame },
    { key: 'combat', label: '战斗', icon: Zap },
    { key: 'exploration', label: '探索', icon: Target },
    { key: 'special', label: '特殊', icon: Crown }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const completedCount = achievements.filter(a => a.completed).length;
  const totalPoints = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.points, 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'legendary': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      case 'legendary': return '传奇';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-100">
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
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold text-gray-700">成就系统</span>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* 总览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{completedCount}</p>
            <p className="text-sm text-gray-600">已完成成就</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <Star className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{totalPoints}</p>
            <p className="text-sm text-gray-600">成就点数</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{Math.round((completedCount / achievements.length) * 100)}%</p>
            <p className="text-sm text-gray-600">完成度</p>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.key
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-yellow-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* 成就列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                achievement.completed ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {/* 成就图标和状态 */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{achievement.icon}</div>
                <div className="flex flex-col items-end space-y-2">
                  {achievement.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(achievement.difficulty)}`}>
                    {getDifficultyLabel(achievement.difficulty)}
                  </span>
                </div>
              </div>

              {/* 成就信息 */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{achievement.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                
                {/* 进度条 */}
                {!achievement.completed && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>进度</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 奖励信息 */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">奖励</p>
                    <p className="text-sm font-medium text-gray-700">{achievement.reward}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">点数</p>
                    <p className="text-sm font-bold text-yellow-600">+{achievement.points}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">该分类下暂无成就</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;