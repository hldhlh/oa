-- 数据库函数定义

-- 创建用户资料函数
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 当新用户注册时自动创建用户资料
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 记录审计日志函数
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    user_profile_id UUID;
BEGIN
    -- 获取当前用户的profile ID
    SELECT id INTO user_profile_id 
    FROM user_profiles 
    WHERE user_id = auth.uid();

    -- 插入审计日志
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, timestamp
        ) VALUES (
            user_profile_id,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD),
            NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, new_values, timestamp
        ) VALUES (
            user_profile_id,
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, new_values, timestamp
        ) VALUES (
            user_profile_id,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为重要表添加审计日志触发器
CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_stores
    AFTER INSERT OR UPDATE OR DELETE ON stores
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_staff
    AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_formulas
    AFTER INSERT OR UPDATE OR DELETE ON formulas
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- 记录文档访问日志函数
CREATE OR REPLACE FUNCTION log_document_access(
    doc_id UUID,
    action_type VARCHAR(20),
    user_ip INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    user_profile_id UUID;
BEGIN
    -- 获取当前用户的profile ID
    SELECT id INTO user_profile_id 
    FROM user_profiles 
    WHERE user_id = auth.uid();

    -- 插入访问日志
    INSERT INTO document_access_logs (
        document_id, user_id, action, ip_address, user_agent, accessed_at
    ) VALUES (
        doc_id, user_profile_id, action_type, user_ip, user_agent_string, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户权限函数
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR(20) AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户权限函数
CREATE OR REPLACE FUNCTION check_user_permission(required_role VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
    role_hierarchy JSONB := '{"viewer": 1, "staff": 2, "manager": 3, "admin": 4}';
BEGIN
    user_role := get_user_role();
    
    RETURN (role_hierarchy->>user_role)::INTEGER >= (role_hierarchy->>required_role)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 搜索文档函数
CREATE OR REPLACE FUNCTION search_documents(
    search_term TEXT,
    doc_type VARCHAR(50) DEFAULT NULL,
    access_level VARCHAR(20) DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    type VARCHAR(50),
    content TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.type,
        d.content,
        d.file_name,
        d.created_at,
        ts_rank(
            to_tsvector('chinese', COALESCE(d.title, '') || ' ' || COALESCE(d.content, '')),
            plainto_tsquery('chinese', search_term)
        ) as relevance
    FROM documents d
    WHERE 
        (doc_type IS NULL OR d.type = doc_type)
        AND (access_level IS NULL OR d.access_level = access_level)
        AND d.status = 'active'
        AND (
            to_tsvector('chinese', COALESCE(d.title, '') || ' ' || COALESCE(d.content, ''))
            @@ plainto_tsquery('chinese', search_term)
            OR d.title ILIKE '%' || search_term || '%'
            OR d.content ILIKE '%' || search_term || '%'
        )
    ORDER BY relevance DESC, d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 搜索配方函数
CREATE OR REPLACE FUNCTION search_formulas(
    search_term TEXT,
    formula_type VARCHAR(50) DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    type VARCHAR(50),
    description TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type,
        f.description,
        f.instructions,
        f.created_at,
        ts_rank(
            to_tsvector('chinese', COALESCE(f.name, '') || ' ' || COALESCE(f.description, '') || ' ' || COALESCE(f.instructions, '')),
            plainto_tsquery('chinese', search_term)
        ) as relevance
    FROM formulas f
    WHERE 
        (formula_type IS NULL OR f.type = formula_type)
        AND f.status = 'active'
        AND (
            to_tsvector('chinese', COALESCE(f.name, '') || ' ' || COALESCE(f.description, '') || ' ' || COALESCE(f.instructions, ''))
            @@ plainto_tsquery('chinese', search_term)
            OR f.name ILIKE '%' || search_term || '%'
            OR f.description ILIKE '%' || search_term || '%'
            OR f.instructions ILIKE '%' || search_term || '%'
        )
    ORDER BY relevance DESC, f.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取仪表板统计数据函数
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    store_count INTEGER;
    staff_count INTEGER;
    formula_count INTEGER;
    document_count INTEGER;
    active_user_count INTEGER;
BEGIN
    -- 统计门店数量
    SELECT COUNT(*) INTO store_count FROM stores WHERE status = 'active';
    
    -- 统计员工数量
    SELECT COUNT(*) INTO staff_count FROM staff WHERE status = 'active';
    
    -- 统计配方数量
    SELECT COUNT(*) INTO formula_count FROM formulas WHERE status = 'active';
    
    -- 统计文档数量
    SELECT COUNT(*) INTO document_count FROM documents WHERE status = 'active';
    
    -- 统计活跃用户数量
    SELECT COUNT(*) INTO active_user_count FROM user_profiles WHERE status = 'active';
    
    -- 构建统计数据JSON
    stats := jsonb_build_object(
        'stores', store_count,
        'staff', staff_count,
        'formulas', formula_count,
        'documents', document_count,
        'active_users', active_user_count,
        'updated_at', NOW()
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户通知函数
CREATE OR REPLACE FUNCTION get_user_notifications(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    message TEXT,
    type VARCHAR(20),
    is_read BOOLEAN,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_profile_id UUID;
BEGIN
    -- 获取当前用户的profile ID
    SELECT up.id INTO user_profile_id 
    FROM user_profiles up
    WHERE up.user_id = auth.uid();

    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.action_url,
        n.created_at
    FROM notifications n
    WHERE n.user_id = user_profile_id
    ORDER BY n.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 标记通知为已读函数
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile_id UUID;
    updated_count INTEGER;
BEGIN
    -- 获取当前用户的profile ID
    SELECT up.id INTO user_profile_id 
    FROM user_profiles up
    WHERE up.user_id = auth.uid();

    -- 更新通知状态
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = notification_id AND user_id = user_profile_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建通知函数
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_title VARCHAR(200),
    notification_message TEXT,
    notification_type VARCHAR(20) DEFAULT 'info',
    notification_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (target_user_id, notification_title, notification_message, notification_type, notification_action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 批量创建通知函数（给特定角色的所有用户）
CREATE OR REPLACE FUNCTION create_role_notification(
    target_role VARCHAR(20),
    notification_title VARCHAR(200),
    notification_message TEXT,
    notification_type VARCHAR(20) DEFAULT 'info',
    notification_action_url TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM user_profiles 
        WHERE role = target_role AND status = 'active'
    LOOP
        PERFORM create_notification(
            user_record.id,
            notification_title,
            notification_message,
            notification_type,
            notification_action_url
        );
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
