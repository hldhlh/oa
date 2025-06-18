import { loadSupabase } from './api.js';

export async function register(email, password, userData = {}) {
    const supabase = await loadSupabase();
    // 密码规则前端校验
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        return { error: { message: "密码最少8个字符，且必须包含字母和数字。" } };
    }
    return supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
    });
}

export async function login(email, password) {
    const supabase = await loadSupabase();
    return supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
    const supabase = await loadSupabase();
    return supabase.auth.signOut();
}

export async function onAuthStateChange(callback) {
    const supabase = await loadSupabase();
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return subscription;
}

export async function getSession() {
    const supabase = await loadSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
} 