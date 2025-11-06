-- 权限设置和RSL规则配置

-- 启用行级安全(RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE literature_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- 用户表权限规则
CREATE POLICY "用户只能查看自己的用户信息" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的信息" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "管理员可以查看所有用户信息" ON users
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 案例表权限规则
CREATE POLICY "所有用户可查看已验证的案例" ON cases
    FOR SELECT USING (is_verified = true);

CREATE POLICY "认证用户可查看自己的案例" ON cases
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "认证用户可创建案例" ON cases
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户可更新自己的案例" ON cases
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "用户可删除自己的案例" ON cases
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "管理员可管理所有案例" ON cases
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 案例标签表权限规则
CREATE POLICY "用户可查看案例的标签" ON case_tags
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM cases WHERE id = case_tags.case_id AND (is_verified = true OR user_id = auth.uid())
    ));

CREATE POLICY "用户可管理自己案例的标签" ON case_tags
    FOR ALL USING (EXISTS (
        SELECT 1 FROM cases WHERE id = case_tags.case_id AND user_id = auth.uid()
    ));

-- AI提取记录表权限规则
CREATE POLICY "用户可查看自己案例的AI提取记录" ON ai_extractions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM cases WHERE id = ai_extractions.case_id AND user_id = auth.uid()
    ));

CREATE POLICY "管理员可查看所有AI提取记录" ON ai_extractions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 分析记录表权限规则
CREATE POLICY "用户可查看自己的分析记录" ON analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "用户可创建分析记录" ON analytics
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 文献来源表权限规则（公开读取）
CREATE POLICY "所有用户可查看文献来源" ON literature_sources
    FOR SELECT USING (true);

CREATE POLICY "管理员可管理文献来源" ON literature_sources
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 基础权限授予
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 匿名用户权限
GRANT SELECT ON cases TO anon;
GRANT SELECT ON literature_sources TO anon;
GRANT SELECT ON case_tags TO anon;

-- 认证用户权限
GRANT ALL PRIVILEGES ON cases TO authenticated;
GRANT ALL PRIVILEGES ON literature_sources TO authenticated;
GRANT ALL PRIVILEGES ON case_tags TO authenticated;
GRANT ALL PRIVILEGES ON ai_extractions TO authenticated;
GRANT ALL PRIVILEGES ON analytics TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;