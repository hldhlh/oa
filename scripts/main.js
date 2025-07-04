// main.js - 主应用外壳逻辑

// -------------------
// Supabase 客户端初始化
// -------------------
const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------
// UI 元素
// -------------------
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const navLinks = document.querySelectorAll('.nav-link');
const contentFrame = document.getElementById('content-frame');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

// -------------------
// 核心功能
// -------------------

/**
 * 检查用户会话并更新UI
 */
async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('获取会话失败:', error);
        return;
    }

    if (!session) {
        console.log('用户未登录，将重定向到登录页。');
        window.location.href = 'index.html';
        return;
    }
    
    const user = session.user;
    console.log('用户已登录:', user.email);
    if (userInfo) {
        userInfo.textContent = `你好, ${user.email}`;
    }
}

/**
 * 处理用户登出
 */
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('登出失败:', error);
        // 可以在这里显示一个错误提示
    } else {
        console.log('用户已登出，将重定向到登录页。');
        window.location.href = 'index.html';
    }
}

/**
 * 处理导航链接点击事件
 * @param {Event} e - 点击事件对象
 */
function handleNavClick(e) {
    e.preventDefault(); // 阻止默认的链接跳转行为
    
    const targetUrl = e.currentTarget.dataset.target;
    if (!targetUrl || contentFrame.src.endsWith(targetUrl)) {
        return; // 如果目标URL无效或已经是当前页面，则不执行任何操作
    }

    console.log(`导航到: ${targetUrl}`);
    contentFrame.src = targetUrl;

    // 更新 active 状态
    navLinks.forEach(link => link.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // 如果是移动端视图，点击后关闭菜单
    if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburgerBtn.classList.remove('active');
    }
}

/**
 * 切换移动端菜单的显示和隐藏
 */
function toggleMobileMenu() {
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// -------------------
// 事件监听器
// -------------------
document.addEventListener('DOMContentLoaded', () => {
    checkSession(); // 页面加载时立即检查会话
});

if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

if (navLinks.length > 0) {
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
}

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
} 