// 1. Supabase 客户端初始化
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. DOM 元素获取
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

/**
 * 核心功能：页面加载时检查用户认证状态
 */
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

    if (sessionError || !session) {
        if (sessionError) console.error('获取会话失败:', sessionError.message);
        alert('您尚未登录或会话已过期，请重新登录。');
        window.location.href = '../../index.html';
        return;
    }

    // 如果用户已登录, 显示用户信息
    const user = session.user;
    if (user) {
        userInfo.textContent = user.email;
    } else {
        alert('无法获取用户信息，请重新登录。');
        await handleLogout();
    }

    // 为汉堡按钮添加事件监听器
    hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('is-active');
    });
});

/**
 * 处理用户登出
 */
async function handleLogout() {
    logoutButton.disabled = true;
    logoutButton.textContent = '正在登出...';

    const { error } = await _supabase.auth.signOut();

    if (error) {
        alert(`登出失败: ${error.message}`);
        logoutButton.disabled = false;
        logoutButton.textContent = '登出';
    } else {
        window.location.href = '../../index.html';
    }
}

// 3. 事件监听器初始化
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
}); 