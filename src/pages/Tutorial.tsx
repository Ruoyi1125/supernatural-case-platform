import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, Gamepad2, Target, Zap } from 'lucide-react';

const Tutorial: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: '欢迎来到拳击世界',
      content: '这是一个结合健身与游戏的开放世界拳击体验。你将在虚拟世界中进行真实的拳击锻炼。',
      icon: Target,
      tips: [
        '游戏支持手柄和键盘鼠标操作',
        '建议在空旷的空间内进行游戏',
        '准备好毛巾和水，开始你的健身之旅'
      ]
    },
    {
      title: '手柄操作指南',
      content: '连接手柄获得最佳体验。手柄的动作将直接映射到游戏中的拳击动作。',
      icon: Gamepad2,
      tips: [
        '左摇杆：移动角色',
        '右摇杆：调整视角',
        'L1/R1：左右拳击',
        'L2/R2：重拳攻击',
        '方向键：快速闪避'
      ]
    },
    {
      title: '拳击技巧',
      content: '掌握基础拳击技巧，提高战斗效率和锻炼效果。',
      icon: Zap,
      tips: [
        '直拳：快速有力的正面攻击',
        '勾拳：侧面弧形攻击',
        '上勾拳：向上的强力攻击',
        '组合拳：连续攻击获得更高伤害',
        '防守：适时格挡和闪避'
      ]
    },
    {
      title: '健身追踪',
      content: '游戏会实时追踪你的运动数据，帮助你达成健身目标。',
      icon: Target,
      tips: [
        '卡路里消耗实时显示',
        '拳击次数和强度统计',
        '运动时长记录',
        '心率监测（需要设备支持）',
        '每日/每周健身目标设定'
      ]
    }
  ];

  const currentTutorial = tutorialSteps[currentStep];
  const IconComponent = currentTutorial.icon;

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startGame = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-orange-100 flex flex-col">
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
          <Home className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-semibold text-gray-700">新手教程</span>
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-center space-x-2">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-blue-500'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          {currentStep + 1} / {tutorialSteps.length}
        </div>
      </div>

      {/* 教程内容 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-4xl w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <IconComponent className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {currentTutorial.title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {currentTutorial.content}
            </p>
          </div>

          {/* 提示列表 */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">重要提示</h3>
            <ul className="space-y-2">
              {currentTutorial.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-blue-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>上一步</span>
            </button>

            {currentStep === tutorialSteps.length - 1 ? (
              <button
                onClick={startGame}
                className="flex items-center space-x-2 px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <span>开始游戏</span>
                <Zap className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span>下一步</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;