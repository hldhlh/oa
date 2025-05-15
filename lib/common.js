// common.js - 通用工具函数和登录态管理

/**
 * 检查用户是否已登录。
 * 如果未登录，则跳转到登录页面。
 * @param {string} redirectTo - 如果未登录，重定向到的页面路径，默认为 '../login/index.html'
 */
export function checkLoginStatus(redirectTo = '../login/index.html') {
    const userInfo = localStorage.getItem('oa_user_info');
    if (!userInfo) {
        // 如果当前页面不是登录页或注册页，则进行跳转
        if (!window.location.pathname.includes('/login/') && !window.location.pathname.includes('/signup/')) {
            window.location.href = redirectTo;
        }
        return null; // 未登录
    }
    try {
        return JSON.parse(userInfo); // 已登录，返回用户信息
    } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('oa_user_info'); // 无效数据，清除
        if (!window.location.pathname.includes('/login/') && !window.location.pathname.includes('/signup/')) {
            window.location.href = redirectTo;
        }
        return null;
    }
}

/**
 * 用户注销。
 * 清除存储的用户信息并跳转到登录页面。
 */
export function logout() {
    localStorage.removeItem('oa_user_info');
    // 可选：通知 Supabase 后端用户已登出（如果使用了 Supabase Auth 的话，这里自定义auth不需要特别操作）
    window.location.href = '../login/index.html'; // 假设 login 页面在 pages/login/ 目录下
}

/**
 * 获取当前登录的用户信息。
 * @returns {object|null} 用户信息对象或 null (如果未登录)
 */
export function getCurrentUser() {
    const userInfo = localStorage.getItem('oa_user_info');
    if (userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (e) {
            console.error('解析用户信息失败:', e);
            return null;
        }
    }
    return null;
}

/**
 * 导航高亮 (示例函数，需要根据实际导航栏结构调整)
 * @param {string} currentPagePath - 当前页面的路径 (例如 'dashboard', 'apply')
 */
export function highlightNavigation(currentPagePath) {
    // 假设导航链接的格式是 <a href="../[page]/index.html">...</a>
    // 并且导航栏有一个共同的父元素，例如 <nav id="mainNav">...</nav>
    const navLinks = document.querySelectorAll('#mainNav a'); // 需要实际的导航栏选择器
    navLinks.forEach(link => {
        // 从 href 中提取页面名称，例如 '../dashboard/index.html' -> 'dashboard'
        const linkPath = link.getAttribute('href').split('/')[1];
        if (linkPath === currentPagePath) {
            link.classList.add('active'); // 给当前页面的链接添加 'active' 类
        } else {
            link.classList.remove('active');
        }
    });
}

// 可以在这里添加其他全局工具函数 