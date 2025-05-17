-- 员工基本信息表
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('前厅', '后厨', '洗碗间')),
    employment_type TEXT NOT NULL CHECK (employment_type IN ('全职', '兼职')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name)
);

-- 工作日配置表
CREATE TABLE workdays (
    id SERIAL PRIMARY KEY,
    day_name TEXT NOT NULL CHECK (day_name IN ('周一', '周二', '周三', '周四', '周五', '周六', '周日')),
    is_peak_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(day_name)
);

-- 排班信息表
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    day_id INTEGER REFERENCES workdays(id) ON DELETE CASCADE,
    is_resting BOOLEAN DEFAULT false,
    note TEXT,
    segments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, day_id)
);

-- 初始化工作日数据
INSERT INTO workdays (day_name, is_peak_day) VALUES
('周一', false),
('周二', false),
('周三', false),
('周四', false),
('周五', false),
('周六', true),
('周日', true);

-- 插入员工数据
INSERT INTO staff (name, role, employment_type) VALUES
('张胜', '前厅', '全职'),
('李世麟', '前厅', '全职'),
('王艳', '前厅', '兼职'),
('皱震平', '后厨', '全职'),
('皱琦', '后厨', '全职'),
('陈亮', '后厨', '兼职'),
('石素英', '洗碗间', '全职');

-- 创建视图简化查询
CREATE VIEW schedule_view AS
SELECT 
    s.id,
    st.name,
    st.role,
    st.employment_type,
    w.day_name,
    w.is_peak_day,
    s.is_resting,
    s.note,
    s.segments,
    s.created_at
FROM schedules s
JOIN staff st ON s.staff_id = st.id
JOIN workdays w ON s.day_id = w.id;

-- 创建函数简化排班插入
CREATE OR REPLACE FUNCTION insert_schedule(
    p_name TEXT,
    p_day_name TEXT,
    p_is_resting BOOLEAN,
    p_note TEXT DEFAULT NULL,
    p_segments JSONB DEFAULT '[]'::jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO schedules (staff_id, day_id, is_resting, note, segments)
    SELECT 
        st.id,
        w.id,
        p_is_resting,
        p_note,
        p_segments
    FROM staff st
    CROSS JOIN workdays w
    WHERE st.name = p_name
    AND w.day_name = p_day_name
    ON CONFLICT (staff_id, day_id) 
    DO UPDATE SET
        is_resting = EXCLUDED.is_resting,
        note = EXCLUDED.note,
        segments = EXCLUDED.segments;
END;
$$ LANGUAGE plpgsql;

-- 示例：插入排班数据
SELECT insert_schedule('张胜', '周一', true);
SELECT insert_schedule('李世麟', '周一', false, null, 
    '[{"type":"work","start_percent":29.16,"width_percent":44.44},
      {"type":"rest","start_percent":73.61,"width_percent":11.11},
      {"type":"work","start_percent":84.72,"width_percent":11.11}]'
); 