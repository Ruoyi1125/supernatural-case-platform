-- 插入初始文献来源数据
INSERT INTO literature_sources (title, author, dynasty, category, reference_text, metadata) VALUES
('折狱龟鉴', '郑克', '宋代', '法医学著作', '中国古代法医学经典著作，记录了众多司法案例', '{"type": "legal_medical", "importance": "high"}'),
('阅微草堂笔记', '纪昀', '清代', '笔记小说', '清代文人笔记，包含大量民间故事和案例', '{"type": "literary_notes", "importance": "medium"}'),
('包公案', '佚名', '明代', '公案小说', '明代公案小说集，反映了当时的司法观念', '{"type": "legal_fiction", "importance": "medium"}'),
('棠阴比事', '桂万荣', '宋代', '司法案例集', '宋代司法案例汇编，包含大量实际案例', '{"type": "legal_cases", "importance": "high"}'),
('名公书判清明集', '佚名', '宋代', '司法判例集', '宋代名臣判例汇编，具有重要史料价值', '{"type": "legal_judgments", "importance": "high"}'),
('洗冤集录', '宋慈', '宋代', '法医学著作', '世界上最早的法医学专著', '{"type": "legal_medical", "importance": "high"}');

-- 插入初始案例数据（用于演示）
INSERT INTO cases (
    user_id, case_name, dynasty, year, location, core_facts, 
    interaction_method, judicial_functions, official_strategy, 
    case_category, evidence_status, source_id, raw_text, 
    structured_data, is_verified, created_at
) VALUES (
    (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
    '张氏冤魂托梦案',
    '宋代',
    '淳熙年间',
    '江南西路',
    '张氏妇被夫杀害，冤魂托梦于其母，告知被害真相及埋尸地点',
    '托梦',
    '["伸冤", "证据获取"]',
    '验证型',
    '谋杀',
    '证据链残缺',
    (SELECT id FROM literature_sources WHERE title = '折狱龟鉴' LIMIT 1),
    '江南西路张氏妇，被夫杀害。冤魂托梦于其母，告知被害真相及埋尸地点。母告官，掘尸得证，夫伏法。',
    '{"victim": "张氏妇", "perpetrator": "其夫", "key_elements": ["托梦", "掘尸", "伏法"]}',
    true,
    NOW() - INTERVAL '30 days'
),
(
    (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
    '王生冤魂显形案',
    '明代',
    '永乐年间', 
    '山东济南府',
    '王生被仇家杀害，冤魂显形于县官面前，指认证据所在',
    '显形',
    '["伸冤", "证据指认"]',
    '验证型',
    '谋杀',
    '证据充足',
    (SELECT id FROM literature_sources WHERE title = '包公案' LIMIT 1),
    '山东济南府王生，被仇家杀害。冤魂显形于县官面前，指认证据所在。官掘地得凶器，仇家伏法。',
    '{"victim": "王生", "perpetrator": "仇家", "key_elements": ["显形", "指认证据", "掘地得凶器"]}',
    true,
    NOW() - INTERVAL '25 days'
),
(
    (SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1),
    '田产纠纷鬼附体案',
    '清代',
    '康熙年间',
    '直隶保定府',
    '田产纠纷中，一方当事人被冤鬼附体，说出隐情真相',
    '附体',
    '["真相揭露", "调解纠纷"]',
    '借力型',
    '财产纠纷',
    '证据链残缺',
    (SELECT id FROM literature_sources WHERE title = '阅微草堂笔记' LIMIT 1),
    '直隶保定府田产纠纷，一方当事人被冤鬼附体，说出隐情真相。官府据此明断，纠纷得解。',
    '{"dispute_type": "田产纠纷", "resolution_method": "鬼附体揭露真相", "outcome": "官府明断"}',
    true,
    NOW() - INTERVAL '20 days'
);