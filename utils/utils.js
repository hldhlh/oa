// Supabase配置
const SUPABASE_URL = 'https://ainzxxuoweieowjyalgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s';

// Supabase客户端实例
let supabase = null;

// 加载状态管理
let loadingCount = 0;
const loadingCallbacks = [];

// 注册加载状态变化的回调
export function onLoadingChange(callback) {
    loadingCallbacks.push(callback);
    return () => {
        const index = loadingCallbacks.indexOf(callback);
        if (index !== -1) {
            loadingCallbacks.splice(index, 1);
        }
    };
}

// 显示全局加载状态
export function showLoading() {
    loadingCount++;
    if (loadingCount === 1) {
        // 通知所有监听器加载开始
        loadingCallbacks.forEach(callback => callback(true));
        
        // 添加全局加载指示器
        let loadingOverlay = document.getElementById('global-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading-overlay';
            
            // 添加一个加载指示器
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'global-spinner';
            document.body.appendChild(loadingSpinner);
            
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'block';
        
        // 显示全局spinner
        const spinner = document.querySelector('.global-spinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    }
}

// 隐藏全局加载状态
export function hideLoading() {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        // 通知所有监听器加载结束
        loadingCallbacks.forEach(callback => callback(false));
        
        // 隐藏全局加载指示器
        const loadingOverlay = document.getElementById('global-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // 隐藏全局spinner
        const spinner = document.querySelector('.global-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }
}

// 创建一个带有加载状态的异步函数包装器
export function withLoading(asyncFn) {
    return async (...args) => {
        showLoading();
        try {
            return await asyncFn(...args);
        } finally {
            hideLoading();
        }
    };
}

// 初始化Supabase客户端
export async function loadSupabase() {
    if (!supabase) {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// 数据操作函数
export async function fetchData(table, options = {}) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        let query = supabase.from(table).select(options.select || '*');
        
        if (options.where) {
            for (const [key, value] of Object.entries(options.where)) {
                query = query.eq(key, value);
            }
        }
        
        if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        return query;
    })();
}

// 创建数据
export async function createData(table, data) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.from(table).insert(data);
    })();
}

// 更新数据
export async function updateData(table, id, data) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.from(table).update(data).eq('id', id);
    })();
}

// 删除数据
export async function deleteData(table, id) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.from(table).delete().eq('id', id);
    })();
}

// 认证相关函数
// 用户注册
export async function register(email, password, userData = {}) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.auth.signUp({
            email,
            password,
            options: { data: userData }
        });
    })();
}

// 用户登录
export async function login(email, password) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.auth.signInWithPassword({ email, password });
    })();
}

// 用户登出
export async function logout() {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.auth.signOut();
    })();
}

// 获取当前用户
export async function getCurrentUser() {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        const { data } = await supabase.auth.getUser();
        return data.user;
    })();
}

// 获取当前会话
export async function getCurrentSession() {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        const { data } = await supabase.auth.getSession();
        return data.session;
    })();
}

// 监听认证状态变化
export async function onAuthStateChange(callback) {
    const supabase = await loadSupabase();
    return supabase.auth.onAuthStateChange(callback);
}

// 更新用户资料
export async function updateUserProfile(userData) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.auth.updateUser({
            data: userData
        });
    })();
}

// 重置密码
export async function resetPassword(email) {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    })();
}

// 验证用户是否已登录
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// 获取所有用户列表
export async function getAllUsers() {
    return withLoading(async () => {
        const supabase = await loadSupabase();
        const { data, error } = await supabase.from('profiles').select('*');
        
        if (error) {
            console.error('获取用户列表失败:', error);
            return [];
        }
        
        // 如果没有数据，至少返回当前用户
        if (!data || data.length === 0) {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                return [{
                    id: currentUser.id,
                    username: currentUser.user_metadata?.username || '用户',
                    email: currentUser.email,
                    job_title: currentUser.user_metadata?.job_title || '团队成员'
                }];
            }
        }
        
        return data || [];
    })();
}

// 辅助函数
// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

// 表单验证
export function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const fieldRules = rules[field];
        
        if (fieldRules.required && (!value || value.trim() === '')) {
            errors[field] = '此字段为必填项';
            continue;
        }
        
        if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
            errors[field] = `此字段至少需要${fieldRules.minLength}个字符`;
            continue;
        }
        
        if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
            errors[field] = `此字段最多允许${fieldRules.maxLength}个字符`;
            continue;
        }
        
        if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
            errors[field] = fieldRules.message || '此字段格式不正确';
            continue;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// 显示通知
export function showNotification(message, type = 'info', duration = 3000) {
    // 检查是否已存在通知容器
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end gap-2';
        document.body.appendChild(container);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `
        p-4 rounded-xl shadow-lg transform transition-all duration-300 ease-in-out
        ${type === 'success' ? 'bg-green-100 text-green-800' : ''}
        ${type === 'error' ? 'bg-red-100 text-red-800' : ''}
        ${type === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${type === 'info' ? 'bg-blue-100 text-blue-800' : ''}
        flex items-center gap-2 min-w-[240px] translate-x-0 opacity-100
    `;
    
    // 添加图标
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'w-5 h-5');
    iconSvg.setAttribute('viewBox', '0 0 20 20');
    iconSvg.setAttribute('fill', 'currentColor');
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    if (type === 'success') {
        iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z');
    } else if (type === 'error') {
        iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z');
    } else if (type === 'warning') {
        iconPath.setAttribute('d', 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z');
    } else {
        iconPath.setAttribute('d', 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z');
    }
    
    iconSvg.appendChild(iconPath);
    notification.appendChild(iconSvg);
    
    // 添加消息文本
    const messageText = document.createElement('span');
    messageText.textContent = message;
    notification.appendChild(messageText);
    
    // 添加到容器
    container.appendChild(notification);
    
    // 设置自动消失
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// 错误消息翻译
export function translateErrorMessage(message) {
    // 错误消息映射
    const errorMessages = {
        'Password should be at least 6 characters.': '密码长度至少需要6个字符。',
        'Password should be at least 8 characters.': '密码长度至少需要8个字符。',
        'Invalid email': '无效的邮箱地址',
        'Email not confirmed': '邮箱未验证',
        'Email already registered': '该邮箱已被注册',
        'Invalid login credentials': '邮箱或密码错误',
        'User already registered': '该用户已注册',
        'User not found': '用户不存在',
        'Server error': '服务器错误，请稍后重试',
        'Network error': '网络错误，请检查您的网络连接'
    };
    
    // 如果找到对应的翻译，返回翻译后的消息
    return errorMessages[message] || message;
} 