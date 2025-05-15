import { checkLoginStatus, logout, highlightNavigation } from '../../lib/common.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 检查登录状态，如果未登录，common.js中的函数会自动跳转到登录页
    const currentUser = checkLoginStatus();

    if (currentUser) {
        // 2. 如果已登录，显示用户信息
        document.getElementById('userFullName').textContent = currentUser.full_name || '用户';
        document.getElementById('userPhone').textContent = currentUser.phone || '未提供';
        document.getElementById('userPosition').textContent = currentUser.position || '未提供';
        document.getElementById('userRole').textContent = currentUser.role || '未提供';

        // 3. 高亮导航栏
        // highlightNavigation('dashboard'); // common.js 中的函数，需要正确配置导航栏ID

        // 4. 处理注销按钮
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                logout(); // common.js 中的函数
            });
        }
    } else {
        // 如果 checkLoginStatus 返回 null 且没有自动跳转 (例如在登录页自己调用了此脚本)
        // 理论上，如果不在登录/注册页，checkLoginStatus 会自动跳转，所以这里可能不需要额外处理
        console.log("用户未登录，应已被 common.js 定向到登录页。");
    }
}); 