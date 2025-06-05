// Supabase配置
const SUPABASE_URL = 'https://ainzxxuoweieowjyalgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s';

// 初始化Supabase客户端
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 导出供其他模块使用
window.supabase = supabaseClient;

// 检查用户认证状态
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error('认证检查错误:', error);
            return null;
        }
        return user;
    } catch (error) {
        console.error('认证检查异常:', error);
        return null;
    }
}

// 监听认证状态变化
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('认证状态变化:', event, session);

    if (event === 'SIGNED_IN') {
        // 用户登录成功
        const currentPath = window.location.pathname;
        const isRootLoginPage = currentPath === '/' || (currentPath.endsWith('/index.html') && !currentPath.includes('/pages/'));

        if (isRootLoginPage) {
            window.location.href = 'dashboard.html';
        }
    } else if (event === 'SIGNED_OUT') {
        // 用户登出
        const currentPath = window.location.pathname;
        const isRootLoginPage = currentPath === '/' || (currentPath.endsWith('/index.html') && !currentPath.includes('/pages/'));

        if (!isRootLoginPage) {
            // 根据当前路径确定正确的index路径
            const indexPath = currentPath.includes('/pages/') ? '../../index.html' : 'index.html';
            window.location.href = indexPath;
        }
    }
});

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthStatus();
    const currentPath = window.location.pathname;

    // 检查是否在根目录的登录页面
    const isRootLoginPage = currentPath === '/' || (currentPath.endsWith('/index.html') && !currentPath.includes('/pages/'));

    // 如果用户已登录且在根目录登录页面，重定向到仪表板
    if (user && isRootLoginPage) {
        window.location.href = 'dashboard.html';
    }

    // 如果用户未登录且不在根目录登录页面，重定向到登录页
    if (!user && !isRootLoginPage) {
        const indexPath = currentPath.includes('/pages/') ? '../../index.html' : 'index.html';
        window.location.href = indexPath;
    }
});

// 工具函数：显示消息
function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    const messageTextEl = document.getElementById('messageText');
    const messageIconEl = document.getElementById('messageIcon');
    
    if (!messageEl || !messageTextEl || !messageIconEl) return;
    
    messageTextEl.textContent = text;
    
    // 设置图标和颜色
    if (type === 'success') {
        messageIconEl.className = 'h-5 w-5 text-green-500';
        messageIconEl.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>';
    } else if (type === 'error') {
        messageIconEl.className = 'h-5 w-5 text-red-500';
        messageIconEl.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>';
    } else if (type === 'warning') {
        messageIconEl.className = 'h-5 w-5 text-yellow-500';
        messageIconEl.innerHTML = '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>';
    }
    
    // 显示消息
    messageEl.classList.remove('hidden');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 3000);
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
