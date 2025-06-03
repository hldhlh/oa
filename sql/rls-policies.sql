-- 行级安全策略 (Row Level Security Policies)
-- 确保用户只能访问他们有权限的数据

-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户资料表策略
-- 用户只能查看和编辑自己的资料，管理员可以查看所有
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete profiles" ON user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 门店表策略
-- 员工只能查看自己所在的门店，管理员可以查看所有
CREATE POLICY "Staff can view own store" ON stores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN staff s ON s.user_profile_id = up.id
            WHERE up.user_id = auth.uid() AND s.store_id = stores.id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can modify stores" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 员工表策略
-- 员工可以查看同门店的员工信息，管理员可以查看所有
CREATE POLICY "Staff can view colleagues" ON staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up1
            JOIN staff s1 ON s1.user_profile_id = up1.id
            JOIN staff s2 ON s2.store_id = s1.store_id
            WHERE up1.user_id = auth.uid() AND s2.id = staff.id
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can modify staff" ON staff
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 配方表策略
-- 根据访问级别控制配方访问
CREATE POLICY "Users can view active formulas" ON formulas
    FOR SELECT USING (
        status = 'active' OR
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Staff can create formulas" ON formulas
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own formulas" ON formulas
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can delete formulas" ON formulas
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 文档表策略
-- 根据访问级别和用户角色控制文档访问
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        (access_level = 'public') OR
        (access_level = 'staff' AND EXISTS (
            SELECT 1 FROM user_profiles WHERE user_id = auth.uid()
        )) OR
        (access_level = 'manager' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )) OR
        (access_level = 'admin' AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )) OR
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can create documents" ON documents
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers can delete documents" ON documents
    FOR DELETE USING (
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 文档访问日志策略
-- 用户只能查看自己的访问记录，管理员可以查看所有
CREATE POLICY "Users can view own access logs" ON document_access_logs
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "System can insert access logs" ON document_access_logs
    FOR INSERT WITH CHECK (true);

-- 审计日志策略
-- 只有管理员可以查看审计日志
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 通知策略
-- 用户只能查看自己的通知
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 其他表的基本策略（categories, ingredients, formula_ingredients, system_settings）
-- 这些表通常需要更宽松的访问控制

-- 分类表 - 所有认证用户可以查看
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- 原料表 - 所有认证用户可以查看
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view ingredients" ON ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can modify ingredients" ON ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'staff')
        )
    );

-- 配方原料关联表 - 跟随配方的访问控制
ALTER TABLE formula_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view formula ingredients" ON formula_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM formulas f
            WHERE f.id = formula_ingredients.formula_id
            AND (
                f.status = 'active' OR
                f.created_by IN (
                    SELECT id FROM user_profiles WHERE user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY "Users can modify formula ingredients" ON formula_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM formulas f
            JOIN user_profiles up ON up.id = f.created_by
            WHERE f.id = formula_ingredients.formula_id
            AND (
                up.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
                )
            )
        )
    );

-- 系统设置表 - 只有管理员可以修改，公开设置所有人可以查看
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can modify settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
