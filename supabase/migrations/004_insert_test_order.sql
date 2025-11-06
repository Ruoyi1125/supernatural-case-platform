-- 插入测试订单数据
-- 首先获取第一个用户作为订单创建者
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- 获取第一个用户的ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- 如果没有用户，先创建一个测试用户
    IF test_user_id IS NULL THEN
        INSERT INTO users (
            student_id, 
            email, 
            password_hash, 
            name, 
            phone, 
            dormitory_area, 
            building_number, 
            room_number
        ) VALUES (
            '20240001',
            'test@fudan.edu.cn',
            '$2b$10$example.hash.for.testing.purposes.only',
            '测试用户',
            '13800138000',
            '东区',
            '1号楼',
            '101'
        ) RETURNING id INTO test_user_id;
    END IF;
    
    -- 插入测试订单
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
    ) VALUES (
        test_user_id,
        'meituan',
        '{"address": "复旦大学东区食堂", "name": "东区食堂", "lng": 121.5, "lat": 31.3}',
        '{"address": "复旦大学东区1号楼101室", "name": "东区1号楼101室", "lng": 121.501, "lat": 31.301}',
        8.00,
        2.00,
        '请帮我买一份宫保鸡丁盖饭，不要太辣。记得拿餐具，谢谢！',
        'pending',
        true,
        NOW() + INTERVAL '30 minutes'
    );
    
    -- 再插入一个已接单的测试订单
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
    ) VALUES (
        test_user_id,
        'eleme',
        '{"address": "复旦大学南区美食广场", "name": "南区美食广场", "lng": 121.502, "lat": 31.299}',
        '{"address": "复旦大学东区1号楼101室", "name": "东区1号楼101室", "lng": 121.501, "lat": 31.301}',
        6.00,
        0.00,
        '麻辣烫一份，微辣，多加蔬菜',
        'accepted',
        false,
        NOW() + INTERVAL '1 hour'
    );
    
    RAISE NOTICE '测试订单创建成功，用户ID: %', test_user_id;
END $$;