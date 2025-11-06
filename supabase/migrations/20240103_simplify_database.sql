-- 更新数据库结构 - 去除用户相关表和字段
-- 更新案例表结构，移除用户相关字段

-- 移除案例表中的用户相关字段
ALTER TABLE cases 
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS user_id;

-- 更新案例表结构，确保符合简化后的数据模型
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS ai_extraction JSONB DEFAULT '{}',
ALTER COLUMN case_name SET NOT NULL,
ALTER COLUMN dynasty SET NOT NULL,
ALTER COLUMN location SET NOT NULL,
ALTER COLUMN core_facts SET NOT NULL;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_cases_dynasty ON cases(dynasty);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(case_category);
CREATE INDEX IF NOT EXISTS idx_cases_location ON cases(location);
CREATE INDEX IF NOT EXISTS idx_cases_year ON cases(year);
CREATE INDEX IF NOT EXISTS idx_cases_confidence ON cases(confidence);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_cases_search ON cases USING gin(to_tsvector('chinese', 
  case_name || ' ' || 
  core_facts || ' ' || 
  interaction_method || ' ' || 
  judicial_functions || ' ' || 
  official_strategy
));

-- 更新权限设置 - 允许匿名访问
GRANT SELECT ON cases TO anon;
GRANT INSERT ON cases TO anon;
GRANT UPDATE ON cases TO anon;
GRANT DELETE ON cases TO anon;

-- 创建简化后的统计视图
CREATE OR REPLACE VIEW case_statistics AS
SELECT 
  COUNT(*) as total_cases,
  COUNT(DISTINCT dynasty) as dynasty_count,
  COUNT(DISTINCT case_category) as category_count,
  COUNT(DISTINCT location) as location_count,
  AVG(confidence) as avg_confidence,
  MIN(created_at) as earliest_case,
  MAX(created_at) as latest_case
FROM cases;

-- 创建朝代分布视图
CREATE OR REPLACE VIEW dynasty_distribution AS
SELECT 
  dynasty,
  COUNT(*) as case_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cases), 2) as percentage
FROM cases
GROUP BY dynasty
ORDER BY case_count DESC;

-- 创建分类分布视图
CREATE OR REPLACE VIEW category_distribution AS
SELECT 
  case_category,
  COUNT(*) as case_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cases), 2) as percentage,
  AVG(confidence) as avg_confidence
FROM cases
GROUP BY case_category
ORDER BY case_count DESC;

-- 创建交互方式分布视图
CREATE OR REPLACE VIEW interaction_distribution AS
SELECT 
  interaction_method,
  COUNT(*) as case_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cases), 2) as percentage
FROM cases
GROUP BY interaction_method
ORDER BY case_count DESC;

-- 创建月度趋势视图
CREATE OR REPLACE VIEW monthly_trends AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as case_count,
  AVG(confidence) as avg_confidence
FROM cases
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 授予统计视图访问权限
GRANT SELECT ON case_statistics TO anon;
GRANT SELECT ON dynasty_distribution TO anon;
GRANT SELECT ON category_distribution TO anon;
GRANT SELECT ON interaction_distribution TO anon;
GRANT SELECT ON monthly_trends TO anon;