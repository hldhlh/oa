// 认证管理
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userRole = null;
        this.init();
    }

    // 初始化认证管理器
    async init() {
        try {
            // 检查当前用户状态
            await this.checkAuthStatus();
            
            // 监听认证状态变化
            SupabaseAuth.onAuthStateChange((event, session) => {
                this.handleAuthStateChange(event, session);
            });
        } catch (error) {
            console.error('认证初始化失败:', error);
        }
    }

    // 检查认证状态
    async checkAuthStatus() {
        try {
            const user = await SupabaseAuth.getCurrentUser();
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                await this.loadUserProfile();
                this.redirectToDashboard();
            } else {
                this.showAuthPage();
            }
        } catch (error) {
            console.error('检查认证状态失败:', error);
            this.showAuthPage();
        }
    }

    // 处理认证状态变化
    async handleAuthStateChange(event, session) {
        if (event === 'SIGNED_IN' && session) {
            this.currentUser = session.user;
            this.isAuthenticated = true;
            await this.loadUserProfile();
            this.redirectToDashboard();
            showToast('登录成功！', 'success');
        } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.userRole = null;
            this.showAuthPage();
            showToast('已退出登录', 'info');
        }
    }

    // 加载用户资料
    async loadUserProfile() {
        try {
            const profileTable = new SupabaseTable('user_profiles');
            const profile = await profileTable.findWhere({ user_id: this.currentUser.id });
            
            if (profile && profile.length > 0) {
                this.userRole = profile[0].role;
                this.userProfile = profile[0];
            } else {
                // 创建默认用户资料
                await this.createDefaultProfile();
            }
        } catch (error) {
            console.error('加载用户资料失败:', error);
            this.userRole = 'staff'; // 默认角色
        }
    }

    // 创建默认用户资料
    async createDefaultProfile() {
        try {
            const profileTable = new SupabaseTable('user_profiles');
            const defaultProfile = {
                user_id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.name || '新用户',
                role: 'staff',
                status: 'active',
                created_at: new Date().toISOString()
            };
            
            this.userProfile = await profileTable.create(defaultProfile);
            this.userRole = 'staff';
        } catch (error) {
            console.error('创建用户资料失败:', error);
        }
    }

    // 登录
    async login(email, password) {
        try {
            showLoading(true);
            const result = await SupabaseAuth.signIn(email, password);
            
            // 记录登录日志
            await this.logUserAction('login', { email });
            
            return result;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // 注册
    async register(email, password, userData = {}) {
        try {
            showLoading(true);

            // 构建用户元数据
            const userMetadata = {
                name: userData.name || '新用户',
                phone: userData.phone || '',
                role: userData.role || 'staff'
            };

            const result = await SupabaseAuth.signUp(email, password, userMetadata);

            if (result.user && !result.user.email_confirmed_at) {
                showToast('注册成功！请检查邮箱验证链接。', 'success');
            } else if (result.user) {
                showToast('注册成功！', 'success');
            }

            return result;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // 登出
    async logout() {
        try {
            // 记录登出日志
            await this.logUserAction('logout');
            
            await SupabaseAuth.signOut();
        } catch (error) {
            console.error('登出失败:', error);
            showToast('登出失败', 'error');
        }
    }

    // 重置密码
    async resetPassword(email) {
        try {
            await SupabaseAuth.resetPassword(email);
            showToast('密码重置邮件已发送', 'success');
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        }
    }

    // 检查权限
    hasPermission(requiredRole) {
        const roleHierarchy = {
            'viewer': 1,
            'staff': 2,
            'manager': 3,
            'admin': 4
        };

        const userLevel = roleHierarchy[this.userRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    // 权限守卫
    requirePermission(requiredRole) {
        if (!this.isAuthenticated) {
            this.showAuthPage();
            return false;
        }

        if (!this.hasPermission(requiredRole)) {
            showToast('权限不足', 'error');
            return false;
        }

        return true;
    }

    // 显示认证页面
    showAuthPage() {
        hideLoading();
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-page').classList.remove('hidden');
    }

    // 重定向到仪表板
    redirectToDashboard() {
        hideLoading();
        document.getElementById('auth-page').classList.add('hidden');
        
        // 如果当前页面不是仪表板，则重定向
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('main-app').classList.remove('hidden');
        }
    }

    // 记录用户操作日志
    async logUserAction(action, details = {}) {
        try {
            const logTable = new SupabaseTable('audit_logs');
            await logTable.create({
                user_id: this.currentUser?.id,
                action,
                details: JSON.stringify(details),
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('记录日志失败:', error);
        }
    }

    // 获取客户端IP（简化版）
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return {
            user: this.currentUser,
            profile: this.userProfile,
            role: this.userRole,
            isAuthenticated: this.isAuthenticated
        };
    }
}

// 全局认证管理器实例
let authManager = null;

// 初始化认证
function initAuth() {
    authManager = new AuthManager();
    return authManager;
}

// 初始化认证管理器
document.addEventListener('DOMContentLoaded', function() {
    if (!authManager) {
        authManager = initAuth();
    }
});

// 导出认证管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, initAuth };
}
