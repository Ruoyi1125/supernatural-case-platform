-- 插入复旦大学宿舍楼信息
INSERT INTO dormitory_buildings (area, building_number, building_name, latitude, longitude) VALUES
('本部', '1', '本部1号楼', 31.2989, 121.5015),
('本部', '2', '本部2号楼', 31.2991, 121.5017),
('本部', '3', '本部3号楼', 31.2993, 121.5019),
('本部', '4', '本部4号楼', 31.2995, 121.5021),
('本部', '5', '本部5号楼', 31.2997, 121.5023),
('本部', '6', '本部6号楼', 31.2999, 121.5025),
('本部', '7', '本部7号楼', 31.3001, 121.5027),
('本部', '8', '本部8号楼', 31.3003, 121.5029),
('本部', '9', '本部9号楼', 31.3005, 121.5031),
('本部', '10', '本部10号楼', 31.3007, 121.5033),
('本部', '11', '本部11号楼', 31.3009, 121.5035),
('本部', '12', '本部12号楼', 31.3011, 121.5037),
('本部', '13', '本部13号楼', 31.3013, 121.5039),
('本部', '14', '本部14号楼', 31.3015, 121.5041),
('本部', '15', '本部15号楼', 31.3017, 121.5043),
('本部', '16', '本部16号楼', 31.3019, 121.5045),
('本部', '17', '本部17号楼', 31.3021, 121.5047),
('本部', '18', '本部18号楼', 31.3023, 121.5049),
('本部', '19', '本部19号楼', 31.3025, 121.5051),
('本部', '20', '本部20号楼', 31.3027, 121.5053),
('南区', '1', '南区1号楼', 31.2975, 121.5005),
('南区', '2', '南区2号楼', 31.2977, 121.5007),
('南区', '3', '南区3号楼', 31.2979, 121.5009),
('南区', '4', '南区4号楼', 31.2981, 121.5011),
('南区', '5', '南区5号楼', 31.2983, 121.5013),
('北区', '1', '北区1号楼', 31.3035, 121.5055),
('北区', '2', '北区2号楼', 31.3037, 121.5057),
('北区', '3', '北区3号楼', 31.3039, 121.5059),
('北区', '4', '北区4号楼', 31.3041, 121.5061),
('北区', '5', '北区5号楼', 31.3043, 121.5063),
('东区', '1', '东区1号楼', 31.3001, 121.5065),
('东区', '2', '东区2号楼', 31.3003, 121.5067),
('东区', '3', '东区3号楼', 31.3005, 121.5069),
('东区', '4', '东区4号楼', 31.3007, 121.5071),
('东区', '5', '东区5号楼', 31.3009, 121.5073);

-- 创建一些测试用户（密码都是 123456）
-- 注意：在实际生产环境中，应该使用更安全的密码
INSERT INTO users (
  student_id, 
  email,
  name, 
  phone, 
  password_hash, 
  dormitory_area, 
  building_number,
  room_number,
  avatar_url,
  completed_orders,
  rating
) VALUES
(
  '21307130001', 
  '21307130001@fudan.edu.cn',
  '张三', 
  '13800138001', 
  '$2b$10$rOvHPH8.OVFOlMQwupdHNOtEn0lztXGqYdq2RdGGdceKzY8jjO2Gy', -- 123456
  '本部',
  '1',
  '101',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
  12,
  4.8
),
(
  '21307130002', 
  '21307130002@fudan.edu.cn',
  '李四', 
  '13800138002', 
  '$2b$10$rOvHPH8.OVFOlMQwupdHNOtEn0lztXGqYdq2RdGGdceKzY8jjO2Gy', -- 123456
  '本部',
  '2',
  '202',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
  7,
  4.6
),
(
  '21307130003', 
  '21307130003@fudan.edu.cn',
  '王五', 
  '13800138003', 
  '$2b$10$rOvHPH8.OVFOlMQwupdHNOtEn0lztXGqYdq2RdGGdceKzY8jjO2Gy', -- 123456
  '南区',
  '1',
  '303',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
  20,
  4.9
),
(
  '21307130004', 
  '21307130004@fudan.edu.cn',
  '赵六', 
  '13800138004', 
  '$2b$10$rOvHPH8.OVFOlMQwupdHNOtEn0lztXGqYdq2RdGGdceKzY8jjO2Gy', -- 123456
  '北区',
  '1',
  '404',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
  4,
  4.2
),
(
  '21307130005', 
  '21307130005@fudan.edu.cn',
  '孙七', 
  '13800138005', 
  '$2b$10$rOvHPH8.OVFOlMQwupdHNOtEn0lztXGqYdq2RdGGdceKzY8jjO2Gy', -- 123456
  '东区',
  '1',
  '505',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sunqi',
  10,
  4.7
);

-- 创建一些测试订单
INSERT INTO orders (
  creator_id,
  pickup_platform,
  pickup_location,
  delivery_location,
  base_fee,
  urgent_fee,
  special_requirements,
  status,
  is_urgent,
  pickup_time
) VALUES
(
  (SELECT id FROM users WHERE student_id = '21307130001' LIMIT 1),
  '美团',
  '{"name": "兰州拉面", "address": "复旦大学邯郸校区南门", "latitude": 31.2970, "longitude": 121.5000}',
  '{"name": "本部1号楼101", "address": "本部1号楼101", "latitude": 31.2989, "longitude": 121.5015}',
  5.00,
  0.00,
  '不要香菜',
  'pending',
  false,
  NOW() + INTERVAL '30 minutes'
),
(
  (SELECT id FROM users WHERE student_id = '21307130002' LIMIT 1),
  '饿了么',
  '{"name": "麦当劳", "address": "复旦大学邯郸校区东门", "latitude": 31.3000, "longitude": 121.5070}',
  '{"name": "本部2号楼202", "address": "本部2号楼202", "latitude": 31.2991, "longitude": 121.5017}',
  8.00,
  3.00,
  '加急，谢谢！',
  'pending',
  true,
  NOW() + INTERVAL '20 minutes'
),
(
  (SELECT id FROM users WHERE student_id = '21307130003' LIMIT 1),
  '美团',
  '{"name": "沙县小吃", "address": "复旦大学邯郸校区西门", "latitude": 31.3000, "longitude": 121.4980}',
  '{"name": "南区1号楼303", "address": "南区1号楼303", "latitude": 31.2975, "longitude": 121.5005}',
  4.00,
  0.00,
  '多要点辣椒',
  'accepted',
  false,
  NOW() + INTERVAL '45 minutes'
),
(
  (SELECT id FROM users WHERE student_id = '21307130004' LIMIT 1),
  '饿了么',
  '{"name": "肯德基", "address": "复旦大学邯郸校区北门", "latitude": 31.3050, "longitude": 121.5060}',
  '{"name": "北区1号楼404", "address": "北区1号楼404", "latitude": 31.3035, "longitude": 121.5055}',
  6.00,
  2.00,
  '要番茄酱',
  'picking',
  true,
  NOW() + INTERVAL '25 minutes'
),
(
  (SELECT id FROM users WHERE student_id = '21307130005' LIMIT 1),
  '美团',
  '{"name": "黄焖鸡米饭", "address": "复旦大学邯郸校区正门", "latitude": 31.2985, "longitude": 121.5020}',
  '{"name": "东区1号楼505", "address": "东区1号楼505", "latitude": 31.3001, "longitude": 121.5065}',
  7.00,
  0.00,
  '微辣',
  'completed',
  false,
  NOW() + INTERVAL '40 minutes'
);

-- 为已接受的订单分配接单人
UPDATE orders 
SET accepter_id = (SELECT id FROM users WHERE student_id = '21307130005' LIMIT 1)
WHERE status = 'accepted';

UPDATE orders 
SET accepter_id = (SELECT id FROM users WHERE student_id = '21307130001' LIMIT 1)
WHERE status = 'picking';

UPDATE orders 
SET accepter_id = (SELECT id FROM users WHERE student_id = '21307130002' LIMIT 1),
    delivery_time = NOW() - INTERVAL '10 minutes'
WHERE status = 'completed';

-- 创建一些测试评价
INSERT INTO user_ratings (
  rater_id,
  rated_user_id,
  order_id,
  rating,
  comment
) VALUES
(
  (SELECT id FROM users WHERE student_id = '21307130001' LIMIT 1),
  (SELECT id FROM users WHERE student_id = '21307130002' LIMIT 1),
  (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
  5,
  '服务很好，送餐及时！'
),
(
  (SELECT id FROM users WHERE student_id = '21307130003' LIMIT 1),
  (SELECT id FROM users WHERE student_id = '21307130002' LIMIT 1),
  (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
  4,
  '态度不错，下次还会找你代取'
),
(
  (SELECT id FROM users WHERE student_id = '21307130004' LIMIT 1),
  (SELECT id FROM users WHERE student_id = '21307130001' LIMIT 1),
  (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
  5,
  '非常靠谱的代取员！'
);

-- 创建一些测试消息
INSERT INTO messages (
  order_id,
  sender_id,
  content,
  message_type
) VALUES
(
  (SELECT id FROM orders WHERE status = 'accepted' LIMIT 1),
  (SELECT creator_id FROM orders WHERE status = 'accepted' LIMIT 1),
  '你好，什么时候能帮我取餐呢？',
  'text'
),
(
  (SELECT id FROM orders WHERE status = 'accepted' LIMIT 1),
  (SELECT accepter_id FROM orders WHERE status = 'accepted' LIMIT 1),
  '我现在就去取，大概20分钟后送到',
  'text'
),
(
  (SELECT id FROM orders WHERE status = 'picking' LIMIT 1),
  (SELECT accepter_id FROM orders WHERE status = 'picking' LIMIT 1),
  '已经取到餐了，正在送过去',
  'text'
),
(
  (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
  (SELECT creator_id FROM orders WHERE status = 'completed' LIMIT 1),
  '谢谢你的帮助！',
  'text'
),
(
  (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
  (SELECT accepter_id FROM orders WHERE status = 'completed' LIMIT 1),
  '不客气，有需要随时找我',
  'text'
);