-- Grant permissions to anon and authenticated roles for all tables

-- Users table permissions
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Orders table permissions  
GRANT SELECT ON orders TO anon;
GRANT ALL PRIVILEGES ON orders TO authenticated;

-- Messages table permissions
GRANT SELECT ON messages TO anon;
GRANT ALL PRIVILEGES ON messages TO authenticated;

-- Order images table permissions
GRANT SELECT ON order_images TO anon;
GRANT ALL PRIVILEGES ON order_images TO authenticated;

-- User ratings table permissions
GRANT SELECT ON user_ratings TO anon;
GRANT ALL PRIVILEGES ON user_ratings TO authenticated;

-- Dormitory buildings table permissions
GRANT SELECT ON dormitory_buildings TO anon;
GRANT ALL PRIVILEGES ON dormitory_buildings TO authenticated;

-- Dormitories table permissions
GRANT SELECT ON dormitories TO anon;
GRANT ALL PRIVILEGES ON dormitories TO authenticated;

-- Conversations table permissions
GRANT SELECT ON conversations TO anon;
GRANT ALL PRIVILEGES ON conversations TO authenticated;