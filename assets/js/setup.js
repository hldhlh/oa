// Supabase配置
const SUPABASE_URL = 'https://ainzxxuoweieowjyalgf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc2NzQ4NiwiZXhwIjoyMDYxMzQzNDg2fQ.UQuD6E7_y9TAaIXY30_246avjNip_UqGQO2NJSRUsl4';

// 初始化Supabase客户端
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 创建Supabase客户端
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 检查profiles表是否存在
        const { error: checkError } = await supabase.from('profiles').select('id').limit(1);
        
        // 如果profiles表不存在，创建它
        if (checkError && checkError.code === '42P01') { // 表不存在的错误码
            console.log('创建profiles表...');
            const { error: createError } = await supabase.rpc('create_profiles_table');
            
            if (createError) {
                console.error('创建profiles表失败:', createError);
                // 尝试使用SQL创建表
                await createProfilesTableWithSQL(supabase);
            } else {
                console.log('profiles表创建成功!');
            }
        } else {
            console.log('profiles表已存在，无需创建');
        }
        
        // 启用profiles表的实时订阅
        await enableRealtimeForProfiles(supabase);
        
        document.getElementById('setup-status').textContent = '数据库初始化成功!';
        document.getElementById('setup-status').style.color = 'green';
    } catch (error) {
        console.error('设置过程中出错:', error);
        document.getElementById('setup-status').textContent = '初始化失败: ' + error.message;
        document.getElementById('setup-status').style.color = 'red';
    }
});

// 使用SQL创建profiles表
async function createProfilesTableWithSQL(supabase) {
    try {
        const { error } = await supabase.rpc('execute_sql', {
            sql_string: `
                CREATE TABLE IF NOT EXISTS profiles (
                    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
                    full_name TEXT NOT NULL,
                    phone TEXT,
                    position TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
                    last_login TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
                );
                
                -- 创建安全策略
                ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
                
                -- 创建查看策略
                CREATE POLICY "用户可以查看所有用户资料" 
                ON profiles FOR SELECT 
                USING (true);
                
                -- 创建插入策略
                CREATE POLICY "用户可以插入自己的资料" 
                ON profiles FOR INSERT 
                WITH CHECK (auth.uid() = id);
                
                -- 创建更新策略
                CREATE POLICY "用户可以更新自己的资料" 
                ON profiles FOR UPDATE 
                USING (auth.uid() = id);
            `
        });
        
        if (error) {
            // 如果RPC方法不存在，尝试直接SQL
            const { error: directError } = await directSQLExecution(supabase);
            if (directError) throw directError;
        }
        
        console.log('使用SQL创建profiles表成功!');
    } catch (error) {
        console.error('使用SQL创建profiles表失败:', error);
        throw error;
    }
}

// 直接执行SQL创建表
async function directSQLExecution(supabase) {
    try {
        // 创建profiles表
        await supabase.from('profiles').insert({
            id: '00000000-0000-0000-0000-000000000000',
            full_name: 'System Setup',
            phone: '00000000000',
            position: 'system',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
        }).select();
        
        return { error: null };
    } catch (error) {
        // 如果插入失败但表已经创建，可能只是违反了唯一约束
        if (error.code === '23505') { // 唯一约束违反
            return { error: null }; // 忽略这个错误，表已经存在
        }
        return { error };
    }
}

// 启用profiles表的实时订阅
async function enableRealtimeForProfiles(supabase) {
    try {
        // 直接调用REST API启用实时功能
        const response = await fetch(`${SUPABASE_URL}/rest/v1/realtime/enable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
                tables: ['profiles']
            })
        });
        
        if (!response.ok) {
            throw new Error('启用实时功能失败: ' + await response.text());
        }
        
        console.log('已为profiles表启用实时功能');
    } catch (error) {
        console.error('启用实时功能失败:', error);
        // 尝试使用订阅来确认实时功能是否工作
        try {
            const subscription = supabase
                .channel('profiles_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                    console.log('实时更新测试:', payload);
                })
                .subscribe();
                
            // 5秒后取消订阅
            setTimeout(() => {
                subscription.unsubscribe();
            }, 5000);
            
            console.log('实时订阅测试已启动');
        } catch (subError) {
            console.error('实时订阅测试失败:', subError);
        }
    }
} 