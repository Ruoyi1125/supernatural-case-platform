-- 创建增加用户总订单数的函数
CREATE OR REPLACE FUNCTION increment_user_total_orders(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET total_orders = total_orders + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建增加用户完成订单数的函数
CREATE OR REPLACE FUNCTION increment_user_completed_orders(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET completed_orders = completed_orders + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建更新用户评分的函数
CREATE OR REPLACE FUNCTION update_user_rating(user_id UUID)
RETURNS void AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT ROUND(AVG(rating), 2) INTO avg_rating
  FROM user_ratings
  WHERE rated_user_id = user_id;
  
  IF avg_rating IS NOT NULL THEN
    UPDATE users 
    SET rating = avg_rating,
        updated_at = NOW()
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数：当新评价插入时自动更新用户评分
CREATE OR REPLACE FUNCTION trigger_update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_rating(NEW.rated_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：评价插入时更新用户评分
DROP TRIGGER IF EXISTS update_rating_on_insert ON user_ratings;
CREATE TRIGGER update_rating_on_insert
  AFTER INSERT ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_rating();

-- 创建触发器：评价更新时更新用户评分
DROP TRIGGER IF EXISTS update_rating_on_update ON user_ratings;
CREATE TRIGGER update_rating_on_update
  AFTER UPDATE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_rating();

-- 创建触发器：评价删除时更新用户评分
CREATE OR REPLACE FUNCTION trigger_update_user_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_rating(OLD.rated_user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_on_delete ON user_ratings;
CREATE TRIGGER update_rating_on_delete
  AFTER DELETE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_rating_on_delete();

-- 创建获取用户统计信息的函数
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
  total_orders INTEGER,
  completed_orders INTEGER,
  created_orders INTEGER,
  accepted_orders INTEGER,
  avg_rating DECIMAL(3,2),
  total_ratings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.total_orders,
    u.completed_orders,
    (SELECT COUNT(*)::INTEGER FROM orders WHERE creator_id = user_id) as created_orders,
    (SELECT COUNT(*)::INTEGER FROM orders WHERE accepter_id = user_id) as accepted_orders,
    u.rating as avg_rating,
    (SELECT COUNT(*)::INTEGER FROM user_ratings WHERE rated_user_id = user_id) as total_ratings
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建获取订单统计的函数
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE(
  total_orders INTEGER,
  pending_orders INTEGER,
  accepted_orders INTEGER,
  completed_orders INTEGER,
  cancelled_orders INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_orders,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_orders,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_orders
  FROM orders;
END;
$$ LANGUAGE plpgsql;

-- 创建清理过期订单的函数（可选，用于定期清理）
CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 删除7天前创建且仍为pending状态的订单
  DELETE FROM orders 
  WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 授权函数给相关角色
GRANT EXECUTE ON FUNCTION increment_user_total_orders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_completed_orders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_order_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_orders() TO authenticated;