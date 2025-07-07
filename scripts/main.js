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
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 客户端
    const supabase = window.supabase.createClient(
        'https://qdcdhxlguuoksfhelywt.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM'
    );

    // DOM 元素
    const logoutButton = document.getElementById('logout-button');
    const userProfileLink = document.getElementById('user-profile-link'); // a 标签
    const contentFrame = document.getElementById('content-frame');
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    // --- 函数定义区 ---
    // 将函数定义移到顶部，以确保在被调用前已声明
    const updateUserInfoDisplay = (newFullName) => {
        userProfileLink.textContent = `欢迎, ${newFullName}`;
    };
    // 将其附加到 window 对象，以便 iframe 子页面可以调用
    window.updateUserInfoDisplay = updateUserInfoDisplay;

    // 检查用户会话
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        updateUserInfoDisplay(user.user_metadata?.full_name || user.email);
        console.log('用户已登录:', user.email);
    } else {
        console.log('用户未登录，将重定向到登录页。');
        window.location.href = '/';
    }
    
    // 登出逻辑
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('登出时发生错误', error);
        } else {
            window.location.href = '/';
        }
    });

    // 导航逻辑
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            handleNavigation(target, link);
        });
    });

    // --- 新增：处理到个人信息页面的导航 ---
    userProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavigation('pages/profile/index.html');
    });

    function handleNavigation(target, clickedLink = null) {
        console.log('导航到:', target);
        contentFrame.src = target;
        
        // 更新导航链接的激活状态
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        if(clickedLink) {
            clickedLink.classList.add('active');
        }
        // 如果是移动端，点击后关闭菜单
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
        }
    }
    
    // --- 新增：全局消息提示函数 ---
    window.showMesg = (message, type = 'info') => {
        const mesg = document.createElement('div');
        mesg.className = `mesg-box ${type}`;
        mesg.textContent = message;
        document.body.appendChild(mesg);
        
        // 触发显示动画
        setTimeout(() => {
            mesg.classList.add('visible');
        }, 10);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            mesg.classList.remove('visible');
            mesg.addEventListener('transitionend', () => mesg.remove());
        }, 3000);
    };

    // 菜单切换逻辑
    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}); 