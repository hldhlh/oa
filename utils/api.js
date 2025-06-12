// Supabase配置
const SUPABASE_URL = 'https://ainzxxuoweieowjyalgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s';

// Supabase客户端实例
let supabase = null;

// 初始化Supabase客户端
export async function loadSupabase() {
    if (!supabase) {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// 获取Supabase客户端实例
export function getSupabase() {
    if (!supabase) {
        throw new Error('Supabase客户端尚未初始化，请先调用loadSupabase()');
    }
    return supabase;
}

// 数据操作函数
export async function fetchData(table, options = {}) {
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
}

// 创建数据
export async function createData(table, data) {
    const supabase = await loadSupabase();
    return supabase.from(table).insert(data);
}

// 更新数据
export async function updateData(table, id, data) {
    const supabase = await loadSupabase();
    return supabase.from(table).update(data).eq('id', id);
}

// 删除数据
export async function deleteData(table, id) {
    const supabase = await loadSupabase();
    return supabase.from(table).delete().eq('id', id);
} 