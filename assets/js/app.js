// Supabase配置
const SUPABASE_URL = 'https://ainzxxuoweieowjyalgf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc2NzQ4NiwiZXhwIjoyMDYxMzQzNDg2fQ.UQuD6E7_y9TAaIXY30_246avjNip_UqGQO2NJSRUsl4';

// 初始化Supabase客户端
let supabase;

// 载入Supabase JS
function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://lib.baomitu.com/supabase-js/2.5.0/umd/supabase.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 初始化Materialize组件
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 加载Supabase JS
        await loadSupabaseScript();
        
        // 初始化Supabase客户端
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 初始化侧边导航
        const sidenavElems = document.querySelectorAll('.sidenav');
        M.Sidenav.init(sidenavElems);
        
        // 显示Toast消息工具函数
        window.showToast = function(message, classes = 'rounded') {
            M.toast({html: message, classes: classes});
        };
        
        // 检查用户登录状态
        checkAuth();
    } catch (error) {
        console.error('初始化失败:', error);
    }
});

// 检查用户认证状态
async function checkAuth() {
    try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
            // 如果没有登录且不在登录页面，则重定向到登录页
            if (!window.location.href.includes('auth.html') && !window.location.href.endsWith('index.html') && !window.location.href.endsWith('/')) {
                window.location.href = '../app/auth.html';
            }
        } else {
            // 如果已登录且在登录页面，则重定向到仪表盘
            if (window.location.href.includes('auth.html')) {
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error('认证检查失败:', error);
    }
}

// 注销功能
document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'logout-btn' || e.target.id === 'mobile-logout-btn' || e.target.closest('#logout-btn') || e.target.closest('#mobile-logout-btn'))) {
        logout();
    }
});

// 登出函数
async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('登出失败:', error);
        showToast('登出失败，请重试', 'red');
    }
}

// 格式化日期工具函数
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 获取当前用户信息
async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

// 获取用户详细信息
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('获取用户资料失败:', error);
        return null;
    }
} 