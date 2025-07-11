// 导入Supabase客户端
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';

// 备选服务器 - 中国区域可访问的备选服务器
const fallbackUrls = [
    'https://qdcdhxlguuoksfhelywt.supabase.co', // 原始服务器
    'https://qdcdhxlguuoksfhelywt.ap-northeast-1.supabase.co', // 亚太区域服务器（日本）
    'https://qdcdhxlguuoksfhelywt.ap-southeast-1.supabase.co'  // 亚太区域服务器（新加坡）
];

// 初始化Supabase客户端
let supabaseClient = null;
let currentUrlIndex = 0;

// 检测网络连接并选择最佳服务器
async function checkConnection(url) {
    try {
        const response = await fetch(`${url}/rest/v1/?apikey=${supabaseKey}`, {
            method: 'HEAD',
            headers: {
                'apikey': supabaseKey
            }
        });
        return response.ok;
    } catch (error) {
        console.warn(`无法连接到服务器 ${url}:`, error);
        return false;
    }
}

// 初始化Supabase
async function loadSupabase() {
    try {
        // 尝试加载本地库文件
        let createClient;
        
        try {
            // 使用本地库文件
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                createClient = supabase.createClient;
                console.log('使用本地Supabase库');
            } else {
                // 如果本地库加载失败，尝试从CDN加载
                throw new Error('本地库不可用');
            }
        } catch (localError) {
            console.warn('本地Supabase库加载失败，尝试从CDN加载:', localError);
            
            try {
                // 尝试从jsdelivr加载
                const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                createClient = module.createClient;
            } catch (cdnError) {
                console.warn('从jsdelivr加载失败，尝试使用UNPKG:', cdnError);
                // 尝试从UNPKG加载
                const module = await import('https://unpkg.com/@supabase/supabase-js@2');
                createClient = module.createClient;
            }
        }
        
        // 检测最佳服务器
        for (let i = 0; i < fallbackUrls.length; i++) {
            const url = fallbackUrls[i];
            const isConnected = await checkConnection(url);
            
            if (isConnected) {
                currentUrlIndex = i;
                console.log(`使用服务器: ${url}`);
                
                // 创建客户端
                supabaseClient = createClient(url, supabaseKey);
                
                // 将supabase客户端挂载到window对象上，方便其他脚本使用
                window.supabase = supabaseClient;
                
                console.log('Supabase 客户端初始化成功');
                return supabaseClient;
            }
        }
        
        throw new Error('所有服务器连接都失败');
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
