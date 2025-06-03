// Supabase客户端初始化
let supabaseClient = null;

// 初始化Supabase客户端
function initSupabase() {
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
    }
    return supabaseClient;
}

// 获取Supabase客户端实例
function getSupabaseClient() {
    if (!supabaseClient) {
        initSupabase();
    }
    return supabaseClient;
}

// 认证相关方法
const SupabaseAuth = {
    // 登录
    async signIn(email, password) {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },

    // 注册
    async signUp(email, password, userData = {}) {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },

    // 登出
    async signOut() {
        const client = getSupabaseClient();
        const { error } = await client.auth.signOut();
        
        if (error) {
            throw new Error(error.message);
        }
    },

    // 获取当前用户
    async getCurrentUser() {
        const client = getSupabaseClient();
        const { data: { user }, error } = await client.auth.getUser();

        if (error) {
            // 如果是会话缺失错误，返回null而不是抛出错误
            if (error.message.includes('Auth session missing') || error.message.includes('No session')) {
                return null;
            }
            throw new Error(error.message);
        }

        return user;
    },

    // 监听认证状态变化
    onAuthStateChange(callback) {
        const client = getSupabaseClient();
        return client.auth.onAuthStateChange(callback);
    },

    // 重置密码
    async resetPassword(email) {
        const client = getSupabaseClient();
        const { error } = await client.auth.resetPasswordForEmail(email);
        
        if (error) {
            throw new Error(error.message);
        }
    },

    // 更新用户信息
    async updateUser(updates) {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.updateUser(updates);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }
};

// 数据库操作基础类
class SupabaseTable {
    constructor(tableName) {
        this.tableName = tableName;
        this.client = getSupabaseClient();
    }

    // 查询所有记录
    async findAll(options = {}) {
        let query = this.client.from(this.tableName).select('*');
        
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }
        
        const { data, error } = await query;
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }

    // 根据ID查询单条记录
    async findById(id) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }

    // 创建记录
    async create(data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .insert(data)
            .select()
            .single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        return result;
    }

    // 更新记录
    async update(id, data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .update(data)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        return result;
    }

    // 删除记录
    async delete(id) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return true;
    }

    // 条件查询
    async findWhere(conditions) {
        let query = this.client.from(this.tableName).select('*');
        
        for (const [key, value] of Object.entries(conditions)) {
            query = query.eq(key, value);
        }
        
        const { data, error } = await query;
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }

    // 搜索
    async search(column, searchTerm) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .ilike(column, `%${searchTerm}%`);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }
}

// 文件存储操作
const SupabaseStorage = {
    // 上传文件
    async uploadFile(bucket, path, file) {
        const client = getSupabaseClient();
        const { data, error } = await client.storage
            .from(bucket)
            .upload(path, file);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },

    // 下载文件
    async downloadFile(bucket, path) {
        const client = getSupabaseClient();
        const { data, error } = await client.storage
            .from(bucket)
            .download(path);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },

    // 获取文件URL
    getPublicUrl(bucket, path) {
        const client = getSupabaseClient();
        const { data } = client.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    },

    // 删除文件
    async deleteFile(bucket, path) {
        const client = getSupabaseClient();
        const { error } = await client.storage
            .from(bucket)
            .remove([path]);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return true;
    },

    // 列出文件
    async listFiles(bucket, path = '') {
        const client = getSupabaseClient();
        const { data, error } = await client.storage
            .from(bucket)
            .list(path);
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});
