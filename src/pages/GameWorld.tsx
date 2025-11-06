import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Box } from '@react-three/drei';
import { ArrowLeft, Pause, Play, Heart, Zap, Target } from 'lucide-react';

// 3D场景组件
const GameScene: React.FC = () => {
  return (
    <>
      {/* 环境光照 */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* 地面 */}
      <Box args={[50, 0.1, 50]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#4ade80" />
      </Box>

      {/* 拳击训练靶 */}
      <Box args={[2, 3, 0.5]} position={[0, 0.5, -5]}>
        <meshStandardMaterial color="#ef4444" />
      </Box>

      {/* 游戏标题 */}
      <Text
        position={[0, 4, -8]}
        fontSize={1}
        color="#f97316"
        anchorX="center"
        anchorY="middle"
      >
        拳击开放世界
      </Text>

      {/* 操作提示 */}
      <Text
        position={[0, -1, -3]}
        fontSize={0.3}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        使用鼠标拖拽查看场景，连接手柄开始拳击训练
      </Text>
    </>
  );
};

const GameWorld: React.FC = () => {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const [gameStats, setGameStats] = useState({
    health: 100,
    energy: 100,
    score: 0,
    combo: 0,
    calories: 0,
    time: 0
  });

  // 游戏计时器
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          time: prev.time + 1,
          calories: prev.calories + 0.1 // 模拟卡路里消耗
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const exitGame = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* 3D游戏场景 */}
      <Canvas
        camera={{ position: [0, 2, 8], fov: 75 }}
        className="absolute inset-0"
      >
        <GameScene />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>

      {/* 游戏UI覆盖层 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部状态栏 */}
        <div className="flex items-center justify-between p-4 pointer-events-auto">
          <button
            onClick={exitGame}
            className="flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>退出游戏</span>
          </button>

          <div className="flex items-center space-x-4">
            {/* 生命值 */}
            <div className="flex items-center space-x-2 bg-red-500/80 text-white px-3 py-2 rounded-lg">
              <Heart className="w-4 h-4" />
              <span>{gameStats.health}%</span>
            </div>

            {/* 能量值 */}
            <div className="flex items-center space-x-2 bg-blue-500/80 text-white px-3 py-2 rounded-lg">
              <Zap className="w-4 h-4" />
              <span>{gameStats.energy}%</span>
            </div>

            {/* 分数 */}
            <div className="flex items-center space-x-2 bg-orange-500/80 text-white px-3 py-2 rounded-lg">
              <Target className="w-4 h-4" />
              <span>{gameStats.score}</span>
            </div>
          </div>

          <button
            onClick={togglePause}
            className="flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? '继续' : '暂停'}</span>
          </button>
        </div>

        {/* 左侧健身数据 */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-auto">
          <div className="bg-black/50 text-white p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold text-orange-400">健身数据</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>运动时间:</span>
                <span className="text-green-400">{formatTime(gameStats.time)}</span>
              </div>
              <div className="flex justify-between">
                <span>卡路里:</span>
                <span className="text-orange-400">{gameStats.calories.toFixed(1)} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>连击数:</span>
                <span className="text-yellow-400">{gameStats.combo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧操作提示 */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-auto">
          <div className="bg-black/50 text-white p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold text-blue-400">操作提示</h3>
            <div className="space-y-2 text-sm">
              <div>鼠标: 查看场景</div>
              <div>WASD: 移动角色</div>
              <div>空格: 跳跃</div>
              <div>左键: 左拳</div>
              <div>右键: 右拳</div>
              <div className="text-orange-400 mt-2">
                连接手柄获得最佳体验!
              </div>
            </div>
          </div>
        </div>

        {/* 底部连击显示 */}
        {gameStats.combo > 0 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-yellow-500/90 text-black px-6 py-3 rounded-full text-xl font-bold animate-pulse">
              {gameStats.combo} 连击!
            </div>
          </div>
        )}

        {/* 暂停菜单 */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-center mb-6">游戏暂停</h2>
              <div className="space-y-4">
                <button
                  onClick={togglePause}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  继续游戏
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  游戏设置
                </button>
                <button
                  onClick={exitGame}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  退出游戏
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameWorld;