import { loadSupabase, getSupabase } from './api.js';

// 用户注册
export async function register(email, password, userData = {}) {
    const supabase = await loadSupabase();
    return supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
    });
}

// 用户登录
export async function login(email, password) {
    const supabase = await loadSupabase();
    return supabase.auth.signInWithPassword({ email, password });
}

// 用户登出
export async function logout() {
    const supabase = await loadSupabase();
    return supabase.auth.signOut();
}

// 获取当前用户
export async function getCurrentUser() {
    const supabase = await loadSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user;
}

// 获取当前会话
export async function getCurrentSession() {
    const supabase = await loadSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session;
}

// 监听认证状态变化
export async function onAuthStateChange(callback) {
    const supabase = await loadSupabase();
    return supabase.auth.onAuthStateChange(callback);
}

// 更新用户资料
export async function updateUserProfile(userData) {
    const supabase = await loadSupabase();
    return supabase.auth.updateUser({
        data: userData
    });
}

// 重置密码
export async function resetPassword(email) {
    const supabase = await loadSupabase();
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
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

// 检查用户权限
export async function checkPermission(requiredRole) {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // 从用户元数据中获取角色
    const userRole = user.user_metadata?.role || 'user';
    
    // 角色权限层级
    const roles = {
        'user': 1,
        'manager': 2,
        'admin': 3
    };
    
    return roles[userRole] >= roles[requiredRole];
} 