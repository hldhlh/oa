// 仪表板功能
document.addEventListener('DOMContentLoaded', async function() {
    // 检查用户认证状态
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化页面
    initializeDashboard(user);
    
    // 设置用户菜单
    setupUserMenu();
    
    // 加载统计数据
    loadStatistics();
    
    // 加载最近活动
    loadRecentActivities();
});

// 初始化仪表板
function initializeDashboard(user) {
    // 设置用户信息
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    const userInitial = userName.charAt(0).toUpperCase();
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('welcomeUserName').textContent = userName;
    document.getElementById('userInitial').textContent = userInitial;
    
    // 设置当前日期
    const currentDate = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    document.getElementById('currentDate').textContent = currentDate;
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

// 加载统计数据
async function loadStatistics() {
    try {
        // 这里可以添加实际的数据库查询
        // 目前使用模拟数据
        const stats = {
            totalDocuments: 0,
            totalRecipes: 0,
            totalEmployees: 1, // 至少有当前用户
            todayLogins: 1
        };
        
        // 更新统计卡片
        document.getElementById('totalDocuments').textContent = stats.totalDocuments;
        document.getElementById('totalRecipes').textContent = stats.totalRecipes;
        document.getElementById('totalEmployees').textContent = stats.totalEmployees;
        document.getElementById('todayLogins').textContent = stats.todayLogins;
        
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showMessage('加载统计数据失败', 'error');
    }
}

// 加载最近活动
async function loadRecentActivities() {
    try {
        // 这里可以添加实际的活动日志查询
        // 目前使用模拟数据
        const activities = [
            {
                id: 1,
                type: 'login',
                description: '用户登录系统',
                time: new Date(),
                user: '当前用户'
            }
        ];
        
        const activitiesContainer = document.getElementById('recentActivities');
        
        if (activities.length === 0) {
            activitiesContainer.innerHTML = `
                <li class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="mt-2 text-sm">暂无活动记录</p>
                </li>
            `;
            return;
        }
        
        activitiesContainer.innerHTML = activities.map((activity, index) => `
            <li class="${index < activities.length - 1 ? 'pb-8' : ''}">
                <div class="relative">
                    ${index < activities.length - 1 ? '<span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>' : ''}
                    <div class="relative flex space-x-3">
                        <div>
                            <span class="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </span>
                        </div>
                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                                <p class="text-sm text-gray-500">${activity.description}</p>
                                <p class="text-xs text-gray-400">${activity.user}</p>
                            </div>
                            <div class="text-right text-sm whitespace-nowrap text-gray-500">
                                <time datetime="${activity.time.toISOString()}">${formatTime(activity.time)}</time>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
        
    } catch (error) {
        console.error('加载最近活动失败:', error);
        showMessage('加载最近活动失败', 'error');
    }
}

// 格式化时间
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
        return '刚刚';
    } else if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 响应式侧边栏处理
function handleResponsiveSidebar() {
    const sidebar = document.querySelector('aside');
    const mainContent = document.querySelector('main');
    
    function checkScreenSize() {
        if (window.innerWidth < 1024) {
            // 移动端：隐藏侧边栏，调整主内容
            sidebar.classList.add('-translate-x-full', 'lg:translate-x-0');
            mainContent.classList.remove('ml-64');
            mainContent.classList.add('ml-0');
        } else {
            // 桌面端：显示侧边栏
            sidebar.classList.remove('-translate-x-full');
            mainContent.classList.add('ml-64');
            mainContent.classList.remove('ml-0');
        }
    }
    
    // 初始检查
    checkScreenSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize);
}

// 页面加载完成后处理响应式
document.addEventListener('DOMContentLoaded', function() {
    handleResponsiveSidebar();
});

// 导出函数供其他模块使用
window.dashboardFunctions = {
    loadStatistics,
    loadRecentActivities,
    formatTime
};
