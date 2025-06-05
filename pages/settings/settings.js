// 系统设置功能
document.addEventListener('DOMContentLoaded', async function() {
    // 检查用户认证状态
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 初始化页面
    initializeSettingsPage(user);
    
    // 设置用户菜单
    setupUserMenu();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载用户资料
    loadUserProfile(user);
    
    // 更新系统信息
    updateSystemInfo();
});

// 初始化设置页面
function initializeSettingsPage(user) {
    // 设置用户信息
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    const userInitial = userName.charAt(0).toUpperCase();
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userInitial').textContent = userInitial;
}

// 设置用户菜单
function setupUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 选项卡切换
    const profileTab = document.getElementById('profileTab');
    const securityTab = document.getElementById('securityTab');
    const systemTab = document.getElementById('systemTab');
    
    const profilePanel = document.getElementById('profilePanel');
    const securityPanel = document.getElementById('securityPanel');
    const systemPanel = document.getElementById('systemPanel');
    
    profileTab.addEventListener('click', function() {
        switchTab(profileTab, profilePanel, [securityTab, systemTab], [securityPanel, systemPanel]);
    });
    
    securityTab.addEventListener('click', function() {
        switchTab(securityTab, securityPanel, [profileTab, systemTab], [profilePanel, systemPanel]);
    });
    
    systemTab.addEventListener('click', function() {
        switchTab(systemTab, systemPanel, [profileTab, securityTab], [profilePanel, securityPanel]);
    });
    
    // 表单提交
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordUpdate);
    }
}

// 切换选项卡
function switchTab(activeTab, activePanel, inactiveTabs, inactivePanels) {
    // 激活当前选项卡
    activeTab.className = 'border-primary-500 text-primary-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
    activePanel.classList.remove('hidden');
    
    // 取消激活其他选项卡
    inactiveTabs.forEach(tab => {
        tab.className = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
    });
    
    inactivePanels.forEach(panel => {
        panel.classList.add('hidden');
    });
}

// 加载用户资料
async function loadUserProfile(user) {
    try {
        // 设置基本信息
        document.getElementById('email').value = user.email;
        document.getElementById('displayName').value = user.user_metadata?.name || '';
        document.getElementById('phone').value = user.user_metadata?.phone || '';
        document.getElementById('department').value = user.user_metadata?.department || '';
        
    } catch (error) {
        console.error('加载用户资料失败:', error);
        showMessage('加载用户资料失败', 'error');
    }
}

// 处理资料更新
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        name: formData.get('displayName'),
        phone: formData.get('phone'),
        department: formData.get('department')
    };
    
    try {
        // 显示保存状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '保存中...';
        submitBtn.disabled = true;
        
        // 更新用户资料
        const { data, error } = await supabase.auth.updateUser({
            data: profileData
        });
        
        if (error) {
            throw error;
        }
        
        showMessage('资料更新成功！', 'success');
        
        // 更新页面显示的用户名
        if (profileData.name) {
            document.getElementById('userName').textContent = profileData.name;
            document.getElementById('userInitial').textContent = profileData.name.charAt(0).toUpperCase();
        }
        
    } catch (error) {
        console.error('更新资料失败:', error);
        showMessage('更新失败，请重试', 'error');
    } finally {
        // 恢复按钮状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 处理密码更新
async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // 验证密码
    if (newPassword !== confirmPassword) {
        showMessage('新密码和确认密码不一致', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('新密码长度至少为6位', 'error');
        return;
    }
    
    try {
        // 显示保存状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '更新中...';
        submitBtn.disabled = true;
        
        // 更新密码
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            throw error;
        }
        
        showMessage('密码更新成功！', 'success');
        
        // 清空表单
        e.target.reset();
        
    } catch (error) {
        console.error('更新密码失败:', error);
        let errorMessage = '更新失败，请重试';
        
        if (error.message.includes('New password should be different')) {
            errorMessage = '新密码不能与当前密码相同';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        // 恢复按钮状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 更新系统信息
function updateSystemInfo() {
    // 设置最后更新时间
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // 模拟在线用户数（实际项目中可以从数据库获取）
    document.getElementById('onlineUsers').textContent = '1';
}

// 导出数据
async function exportData() {
    try {
        showMessage('数据导出功能开发中...', 'warning');
        
        // 这里可以实现实际的数据导出功能
        // 例如：导出文档、配方、员工等数据
        
    } catch (error) {
        console.error('导出数据失败:', error);
        showMessage('导出失败，请重试', 'error');
    }
}

// 清理缓存
async function clearCache() {
    try {
        // 清理浏览器缓存
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        // 清理本地存储
        localStorage.clear();
        sessionStorage.clear();
        
        showMessage('缓存清理成功！', 'success');
        
        // 延迟刷新页面
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('清理缓存失败:', error);
        showMessage('清理失败，请重试', 'error');
    }
}

// 获取系统统计信息
async function getSystemStats() {
    try {
        // 这里可以添加实际的统计查询
        const stats = {
            totalUsers: 1,
            totalDocuments: 0,
            totalRecipes: 0,
            systemUptime: '正常运行'
        };
        
        return stats;
    } catch (error) {
        console.error('获取系统统计失败:', error);
        return null;
    }
}

// 检查系统健康状态
async function checkSystemHealth() {
    try {
        // 检查数据库连接
        const { data, error } = await supabase
            .from('documents')
            .select('count')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        return {
            database: 'healthy',
            storage: 'healthy',
            auth: 'healthy'
        };
        
    } catch (error) {
        console.error('系统健康检查失败:', error);
        return {
            database: 'error',
            storage: 'unknown',
            auth: 'unknown'
        };
    }
}

// 添加全局事件监听器
document.addEventListener('click', function(e) {
    // 导出数据按钮
    if (e.target.textContent === '导出数据') {
        exportData();
    }
    
    // 清理缓存按钮
    if (e.target.textContent === '清理缓存') {
        clearCache();
    }
});

// 导出函数供全局使用
window.settingsFunctions = {
    exportData,
    clearCache,
    getSystemStats,
    checkSystemHealth
};
