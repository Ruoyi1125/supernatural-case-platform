import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, BarChart3, Trophy, Settings, Gamepad2 } from 'lucide-react';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '开始游戏',
      description: '进入拳击开放世界',
      icon: Play,
      path: '/game',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: '新手教程',
      description: '学习拳击技巧和操作',
      icon: BookOpen,
      path: '/tutorial',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: '锻炼数据',
      description: '查看健身统计和进度',
      icon: BarChart3,
      path: '/stats',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: '成就系统',
      description: '解锁成就和奖励',
      icon: Trophy,
      path: '/achievements',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: '游戏设置',
      description: '调整游戏配置',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-blue-100 flex flex-col">
      {/* 游戏标题 */}
      <div className="text-center py-12">
        <h1 className="text-6xl font-bold text-orange-600 mb-4">
          拳击开放世界
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Boxing Open World
        </p>
        <p className="text-lg text-gray-500">
          锻炼身体，探索世界，成为拳击冠军
        </p>
      </div>

      {/* 手柄连接状态 */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <Gamepad2 className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-gray-600">
            手柄状态: 未连接
          </span>
        </div>
      </div>

      {/* 菜单选项 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`${item.color} text-white p-8 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl group`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm opacity-90">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">
          使用手柄获得最佳游戏体验 | 支持键盘鼠标操作
        </p>
      </div>
    </div>
  );
};

export default MainMenu;