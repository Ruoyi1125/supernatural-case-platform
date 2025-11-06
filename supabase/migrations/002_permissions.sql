-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitory_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_images ENABLE ROW LEVEL SECURITY;

-- 为 anon 角色授予基本权限
GRANT SELECT ON dormitories TO anon;
GRANT SELECT ON dormitory_buildings TO anon;

-- 为 authenticated 角色授予完整权限
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON conversations TO authenticated;
GRANT ALL PRIVILEGES ON messages TO authenticated;
GRANT ALL PRIVILEGES ON user_ratings TO authenticated;
GRANT ALL PRIVILEGES ON dormitories TO authenticated;
GRANT ALL PRIVILEGES ON dormitory_buildings TO authenticated;
GRANT ALL PRIVILEGES ON order_images TO authenticated;

-- 用户表的 RLS 策略
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- 订单表的 RLS 策略
CREATE POLICY "Users can view all orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Order creators and accepters can update orders" ON orders
    FOR UPDATE USING (
        auth.uid()::text = creator_id::text OR 
        auth.uid()::text = accepter_id::text
    );

-- 对话表的 RLS 策略
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        auth.uid()::text = user1_id::text OR 
        auth.uid()::text = user2_id::text
    );

-- 消息表的 RLS 策略（基于 order_id）
CREATE POLICY "Users can view messages for their orders" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = messages.order_id 
            AND (
                auth.uid()::text = orders.creator_id::text OR 
                auth.uid()::text = orders.accepter_id::text
            )
        )
    );

CREATE POLICY "Users can send messages for their orders" ON messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id::text AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = messages.order_id 
            AND (
                auth.uid()::text = orders.creator_id::text OR 
                auth.uid()::text = orders.accepter_id::text
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid()::text = sender_id::text);

-- 用户评价表的 RLS 策略
CREATE POLICY "Users can view all ratings" ON user_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON user_ratings
    FOR INSERT WITH CHECK (auth.uid()::text = rater_id::text);

-- 订单图片表的 RLS 策略
CREATE POLICY "Users can view order images" ON order_images
    FOR SELECT USING (true);

CREATE POLICY "Order creators can manage order images" ON order_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_images.order_id 
            AND auth.uid()::text = orders.creator_id::text
        )
    );

-- 宿舍楼表的 RLS 策略
CREATE POLICY "Everyone can view dormitories" ON dormitories
    FOR SELECT USING (true);

CREATE POLICY "Everyone can view dormitory buildings" ON dormitory_buildings
    FOR SELECT USING (true);