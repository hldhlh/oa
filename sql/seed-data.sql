-- 初始数据插入

-- 插入系统设置
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('app_name', '"火锅店OA系统"', '应用程序名称', 'general', true),
('app_version', '"1.0.0"', '应用程序版本', 'general', true),
('max_file_size', '10485760', '最大文件上传大小（字节）', 'upload', false),
('allowed_file_types', '["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif"]', '允许的文件类型', 'upload', false),
('session_timeout', '3600', '会话超时时间（秒）', 'security', false),
('password_min_length', '8', '密码最小长度', 'security', false),
('backup_retention_days', '30', '备份保留天数', 'backup', false),
('notification_email', '"admin@hotpot-oa.com"', '系统通知邮箱', 'notification', false);

-- 插入分类数据
INSERT INTO categories (name, type, description, sort_order) VALUES
-- 文档分类
('政策制度', 'document', '公司政策和制度文档', 1),
('操作规程', 'document', '标准操作程序文档', 2),
('培训资料', 'document', '员工培训相关文档', 3),
('报表模板', 'document', '各类报表模板', 4),
('其他文档', 'document', '其他类型文档', 5),

-- 配方分类
('锅底配方', 'formula', '各种锅底的配方', 1),
('调料配方', 'formula', '调料和蘸料配方', 2),
('特色菜品', 'formula', '特色菜品制作方法', 3),

-- 原料分类
('香料调料', 'ingredient', '各种香料和调料', 1),
('蔬菜类', 'ingredient', '新鲜蔬菜', 2),
('肉类', 'ingredient', '各种肉类食材', 3),
('海鲜类', 'ingredient', '海鲜食材', 4),
('豆制品', 'ingredient', '豆腐等豆制品', 5),
('其他食材', 'ingredient', '其他类型食材', 6);

-- 插入原料数据
INSERT INTO ingredients (name, category_id, unit, cost_per_unit, supplier, description, storage_requirements, shelf_life) VALUES
-- 香料调料
('花椒', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.08, '四川香料供应商', '优质花椒，麻味浓郁', '干燥阴凉处保存', 365),
('干辣椒', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.06, '四川香料供应商', '精选干辣椒，辣味适中', '干燥阴凉处保存', 365),
('豆瓣酱', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.012, '郫县豆瓣厂', '正宗郫县豆瓣酱', '阴凉处保存，开封后冷藏', 730),
('生姜', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.008, '本地蔬菜批发市场', '新鲜生姜', '阴凉通风处保存', 30),
('大蒜', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.01, '本地蔬菜批发市场', '新鲜大蒜', '阴凉通风处保存', 60),
('八角', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.15, '广西香料供应商', '优质八角', '密封干燥保存', 365),
('桂皮', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.12, '广西香料供应商', '优质桂皮', '密封干燥保存', 365),
('香叶', (SELECT id FROM categories WHERE name = '香料调料' AND type = 'ingredient'), 'g', 0.2, '广西香料供应商', '优质香叶', '密封干燥保存', 365),

-- 蔬菜类
('白菜', (SELECT id FROM categories WHERE name = '蔬菜类' AND type = 'ingredient'), 'kg', 3.5, '本地蔬菜批发市场', '新鲜白菜', '冷藏保存', 7),
('菠菜', (SELECT id FROM categories WHERE name = '蔬菜类' AND type = 'ingredient'), 'kg', 8.0, '本地蔬菜批发市场', '新鲜菠菜', '冷藏保存', 3),
('豆芽菜', (SELECT id FROM categories WHERE name = '蔬菜类' AND type = 'ingredient'), 'kg', 4.0, '本地蔬菜批发市场', '新鲜豆芽', '冷藏保存', 2),
('土豆', (SELECT id FROM categories WHERE name = '蔬菜类' AND type = 'ingredient'), 'kg', 2.5, '本地蔬菜批发市场', '新鲜土豆', '阴凉通风处保存', 30),
('冬瓜', (SELECT id FROM categories WHERE name = '蔬菜类' AND type = 'ingredient'), 'kg', 2.0, '本地蔬菜批发市场', '新鲜冬瓜', '阴凉通风处保存', 14),

-- 肉类
('牛肉片', (SELECT id FROM categories WHERE name = '肉类' AND type = 'ingredient'), 'kg', 45.0, '优质肉类供应商', '新鲜牛肉片', '冷冻保存-18°C', 90),
('羊肉片', (SELECT id FROM categories WHERE name = '肉类' AND type = 'ingredient'), 'kg', 38.0, '优质肉类供应商', '新鲜羊肉片', '冷冻保存-18°C', 90),
('猪肉片', (SELECT id FROM categories WHERE name = '肉类' AND type = 'ingredient'), 'kg', 25.0, '优质肉类供应商', '新鲜猪肉片', '冷冻保存-18°C', 90),
('鸭血', (SELECT id FROM categories WHERE name = '肉类' AND type = 'ingredient'), 'kg', 12.0, '本地肉类供应商', '新鲜鸭血', '冷藏保存0-4°C', 3),

-- 海鲜类
('虾滑', (SELECT id FROM categories WHERE name = '海鲜类' AND type = 'ingredient'), 'kg', 35.0, '海鲜供应商', '新鲜虾滑', '冷冻保存-18°C', 180),
('鱼丸', (SELECT id FROM categories WHERE name = '海鲜类' AND type = 'ingredient'), 'kg', 18.0, '海鲜供应商', '优质鱼丸', '冷冻保存-18°C', 180),
('蟹棒', (SELECT id FROM categories WHERE name = '海鲜类' AND type = 'ingredient'), 'kg', 22.0, '海鲜供应商', '蟹味棒', '冷冻保存-18°C', 180),

-- 豆制品
('嫩豆腐', (SELECT id FROM categories WHERE name = '豆制品' AND type = 'ingredient'), 'kg', 6.0, '本地豆制品厂', '新鲜嫩豆腐', '冷藏保存0-4°C', 5),
('老豆腐', (SELECT id FROM categories WHERE name = '豆制品' AND type = 'ingredient'), 'kg', 5.5, '本地豆制品厂', '新鲜老豆腐', '冷藏保存0-4°C', 5),
('豆皮', (SELECT id FROM categories WHERE name = '豆制品' AND type = 'ingredient'), 'kg', 8.0, '本地豆制品厂', '新鲜豆皮', '冷藏保存0-4°C', 3),
('腐竹', (SELECT id FROM categories WHERE name = '豆制品' AND type = 'ingredient'), 'kg', 15.0, '本地豆制品厂', '优质腐竹', '干燥保存', 180);

-- 插入示例配方数据
INSERT INTO formulas (name, type, category_id, description, instructions, prep_time, cook_time, servings, difficulty_level, cost, status, created_by) VALUES
('经典麻辣锅底', 'spicy', (SELECT id FROM categories WHERE name = '锅底配方' AND type = 'formula'), '传统四川麻辣火锅底料，麻辣鲜香', 
'1. 热锅下油，爆香花椒和干辣椒
2. 加入豆瓣酱炒出红油
3. 加入姜蒜爆香
4. 加入高汤煮开
5. 调味即可', 
30, 45, 8, 3, 25.50, 'active', NULL),

('清汤锅底', 'clear', (SELECT id FROM categories WHERE name = '锅底配方' AND type = 'formula'), '清淡鲜美的清汤锅底，适合老人小孩', 
'1. 准备鸡骨架和猪骨
2. 冷水下锅焯水去血沫
3. 重新加水煮制2小时
4. 过滤汤汁，调味即可', 
20, 120, 8, 2, 18.00, 'active', NULL),

('番茄锅底', 'tomato', (SELECT id FROM categories WHERE name = '锅底配方' AND type = 'formula'), '酸甜开胃的番茄锅底', 
'1. 番茄去皮切块
2. 热锅下油炒番茄出汁
3. 加入高汤煮开
4. 调味即可', 
15, 30, 6, 2, 15.00, 'active', NULL),

('菌汤锅底', 'mushroom', (SELECT id FROM categories WHERE name = '锅底配方' AND type = 'formula'), '营养丰富的菌汤锅底', 
'1. 准备各种菌类洗净
2. 热锅下油爆香
3. 加入高汤煮制
4. 调味即可', 
25, 40, 6, 3, 22.00, 'active', NULL);

-- 插入配方原料关联数据
-- 经典麻辣锅底的原料
INSERT INTO formula_ingredients (formula_id, ingredient_id, quantity, unit, notes) VALUES
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '花椒'), 50, 'g', '炒制时注意火候'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '干辣椒'), 100, 'g', '选用中等辣度'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '豆瓣酱'), 200, 'g', '郫县豆瓣酱最佳'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '生姜'), 30, 'g', '切片使用'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '大蒜'), 50, 'g', '拍碎使用'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '八角'), 10, 'g', '增加香味'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '桂皮'), 8, 'g', '增加香味'),
((SELECT id FROM formulas WHERE name = '经典麻辣锅底'), (SELECT id FROM ingredients WHERE name = '香叶'), 5, 'g', '增加香味');

-- 番茄锅底的原料（使用现有原料作为示例）
INSERT INTO formula_ingredients (formula_id, ingredient_id, quantity, unit, notes) VALUES
((SELECT id FROM formulas WHERE name = '番茄锅底'), (SELECT id FROM ingredients WHERE name = '生姜'), 20, 'g', '去腥增香'),
((SELECT id FROM formulas WHERE name = '番茄锅底'), (SELECT id FROM ingredients WHERE name = '大蒜'), 30, 'g', '增加香味');

-- 插入示例文档数据
INSERT INTO documents (title, type, category_id, content, access_level, status, created_by) VALUES
('员工手册', 'policy', (SELECT id FROM categories WHERE name = '政策制度' AND type = 'document'), 
'火锅店员工手册

第一章 公司简介
本公司是一家专业的火锅连锁企业...

第二章 员工行为规范
1. 着装要求
2. 服务标准
3. 卫生要求

第三章 薪酬福利
1. 薪资结构
2. 绩效考核
3. 福利待遇', 'staff', 'active', NULL),

('食品安全操作规程', 'procedure', (SELECT id FROM categories WHERE name = '操作规程' AND type = 'document'), 
'食品安全操作规程

1. 食材采购标准
- 选择合格供应商
- 检查食材新鲜度
- 记录采购信息

2. 食材储存要求
- 分类储存
- 温度控制
- 保质期管理

3. 加工制作规范
- 清洗消毒
- 加工流程
- 温度控制', 'staff', 'active', NULL),

('新员工培训计划', 'training', (SELECT id FROM categories WHERE name = '培训资料' AND type = 'document'), 
'新员工培训计划

第一周：基础培训
- 公司文化介绍
- 规章制度学习
- 安全知识培训

第二周：岗位技能培训
- 服务流程培训
- 产品知识学习
- 实际操作练习

第三周：考核评估
- 理论知识考试
- 实操技能考核
- 综合评估', 'manager', 'active', NULL),

('月度销售报表模板', 'report', (SELECT id FROM categories WHERE name = '报表模板' AND type = 'document'), 
'月度销售报表模板

一、销售概况
1. 总销售额
2. 同比增长率
3. 环比增长率

二、分店销售情况
1. 各店销售排名
2. 客流量统计
3. 人均消费

三、产品销售分析
1. 热销产品TOP10
2. 滞销产品分析
3. 新品推广效果', 'manager', 'active', NULL);

-- 插入示例门店数据
INSERT INTO stores (name, code, address, phone, status, opening_hours, area, capacity) VALUES
('总店', 'HQ001', '成都市锦江区春熙路123号', '028-12345678', 'active', 
'{"monday": "10:00-22:00", "tuesday": "10:00-22:00", "wednesday": "10:00-22:00", "thursday": "10:00-22:00", "friday": "10:00-23:00", "saturday": "10:00-23:00", "sunday": "10:00-22:00"}', 
300.5, 120),

('春熙路分店', 'CXL001', '成都市锦江区春熙路456号', '028-12345679', 'active', 
'{"monday": "11:00-22:00", "tuesday": "11:00-22:00", "wednesday": "11:00-22:00", "thursday": "11:00-22:00", "friday": "11:00-23:00", "saturday": "11:00-23:00", "sunday": "11:00-22:00"}', 
250.0, 100),

('天府广场分店', 'TFGC001', '成都市青羊区天府广场789号', '028-12345680', 'active', 
'{"monday": "11:00-22:00", "tuesday": "11:00-22:00", "wednesday": "11:00-22:00", "thursday": "11:00-22:00", "friday": "11:00-23:00", "saturday": "11:00-23:00", "sunday": "11:00-22:00"}', 
200.0, 80),

('高新区分店', 'GXQ001', '成都市高新区科技园101号', '028-12345681', 'active', 
'{"monday": "11:00-22:00", "tuesday": "11:00-22:00", "wednesday": "11:00-22:00", "thursday": "11:00-22:00", "friday": "11:00-23:00", "saturday": "11:00-23:00", "sunday": "11:00-22:00"}', 
280.0, 110);
