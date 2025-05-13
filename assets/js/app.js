// Supabase配置 - 全局变量
window.supabaseUrl = 'https://ainzxxuoweieowjyalgf.supabase.co';
window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s';

// 初始化Materialize组件
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 确保supabase库已正确加载
        if (!window.supabase) {
            console.error('Supabase库未加载，尝试重新加载...');
            // 动态加载Supabase库
            await loadSupabaseScript();
        }
        
        // 初始化Supabase客户端
        window.supabaseClient = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
        
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

// 动态加载Supabase库
async function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.log('Supabase库加载成功');
            resolve();
        };
        script.onerror = () => {
            console.error('无法加载Supabase库');
            reject(new Error('无法加载Supabase库'));
        };
        document.head.appendChild(script);
    });
}

// 检查用户认证状态
async function checkAuth() {
    try {
        // 使用localStorage检查用户是否已登录
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        if (!isLoggedIn || !currentUser) {
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
        // 清除用户登录状态
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        
        // 重定向到首页
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
        // 从localStorage获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        return currentUser;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

// 获取用户详细信息
async function getUserProfile(userId) {
    try {
        // 先尝试从localStorage获取
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === userId) {
            return currentUser;
        }
        
        // 如果localStorage中没有或不匹配，则从数据库查询
        const { data, error } = await window.supabaseClient
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