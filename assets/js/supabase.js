// 导入Supabase客户端
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';

// 初始化Supabase客户端
let supabaseClient = null;

// 初始化Supabase
async function loadSupabase() {
    try {
        // 动态加载Supabase库
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        // 创建客户端
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        
        // 将supabase客户端挂载到window对象上，方便其他脚本使用
        window.supabase = supabaseClient;
        
        console.log('Supabase 客户端初始化成功');
        return supabaseClient;
    } catch (error) {
        console.error('Supabase 初始化失败:', error);
        return null;
    }
}

// 立即初始化Supabase
const supabasePromise = loadSupabase();

// 辅助函数：检查用户是否已登录
async function checkUserSession() {
    try {
        // 确保Supabase已初始化
        const supabase = window.supabase || await supabasePromise;
        
        if (!supabase) {
            console.error('Supabase 客户端未初始化');
            return null;
        }
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('获取用户会话失败:', error);
            return null;
        }
        
        return data.session ? data.session.user : null;
    } catch (error) {
        console.error('检查用户会话时出错:', error);
        return null;
    }
}

// 辅助函数：重定向到登录页面
function redirectToLogin() {
    window.location.href = '/index.html';
}

// 辅助函数：重定向到仪表盘
function redirectToDashboard() {
    window.location.href = '/pages/dashboard/dashboard.html';
}
