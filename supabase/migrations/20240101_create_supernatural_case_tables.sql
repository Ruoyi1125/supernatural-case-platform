-- 超自然司法案例库平台数据库迁移文件
-- 创建核心数据表

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'researcher' CHECK (role IN ('admin', 'researcher', 'student', 'guest')),
    institution VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文献来源表
CREATE TABLE literature_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    dynasty VARCHAR(50),
    category VARCHAR(100),
    reference_text TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建案例表
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    case_name VARCHAR(255) NOT NULL,
    dynasty VARCHAR(50) NOT NULL,
    year VARCHAR(20),
    location VARCHAR(255),
    core_facts TEXT NOT NULL,
    interaction_method VARCHAR(50) CHECK (interaction_method IN ('托梦', '显形', '附体', '异象', '无形感应')),
    judicial_functions JSONB DEFAULT '[]',
    official_strategy VARCHAR(50) CHECK (official_strategy IN ('验证型', '借力型', '规避型')),
    case_category VARCHAR(50) CHECK (case_category IN ('谋杀', '冤狱', '财产纠纷', '田土争议', '通奸')),
    evidence_status VARCHAR(50) CHECK (evidence_status IN ('无头案', '证据链残缺', '证据充足')),
    source_id UUID REFERENCES literature_sources(id),
    raw_text TEXT NOT NULL,
    structured_data JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建案例标签表
CREATE TABLE case_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建AI提取记录表
CREATE TABLE ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    extracted_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_used VARCHAR(100),
    processing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分析记录表
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_literature_title ON literature_sources(title);
CREATE INDEX idx_literature_dynasty ON literature_sources(dynasty);
CREATE INDEX idx_literature_category ON literature_sources(category);

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_dynasty ON cases(dynasty);
CREATE INDEX idx_cases_interaction_method ON cases(interaction_method);
CREATE INDEX idx_cases_case_category ON cases(case_category);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_is_verified ON cases(is_verified);

CREATE INDEX idx_case_tags_case_id ON case_tags(case_id);
CREATE INDEX idx_case_tags_tag_name ON case_tags(tag_name);
CREATE INDEX idx_case_tags_tag_category ON case_tags(tag_category);

CREATE INDEX idx_ai_extractions_case_id ON ai_extractions(case_id);
CREATE INDEX idx_ai_extractions_confidence ON ai_extractions(confidence_score DESC);
CREATE INDEX idx_ai_extractions_created_at ON ai_extractions(created_at DESC);

CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_analysis_type ON analytics(analysis_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);