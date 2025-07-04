// 仪表盘页面特有的脚本逻辑

// 1. Supabase 客户端初始化
// 为了获取用户信息，此页面需要独立初始化 Supabase
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. DOM 元素获取
const userInfo = document.getElementById('user-info');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu = document.getElementById('nav-menu');

/**
 * 核心功能：页面加载时检查用户认证状态
 */
document.addEventListener('DOMContentLoaded', async () => {
    const welcomeMessage = document.getElementById('welcome-message');
    if (!welcomeMessage) return;

    try {
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            throw new Error(`获取会话失败: ${error.message}`);
        }

        if (session && session.user) {
            const userEmail = session.user.email;
            // 随机选择一句温馨的话
            const greetings = [
                "新的一天，也要元气满满哦！",
                "愿你今天的工作充满成就感。",
                "喝杯咖啡，开始高效的一天吧！",
                "很高兴与你并肩作战。",
                "今天也是努力奋斗的一天呢！"
            ];
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            
            welcomeMessage.innerHTML = `欢迎回来, <strong>${userEmail}</strong><br><small style="font-weight: normal; color: #555;">${randomGreeting}</small>`;
        } else {
            welcomeMessage.textContent = '欢迎使用 OA 系统';
        }
    } catch (e) {
        console.error('更新欢迎信息时出错:', e);
        welcomeMessage.textContent = '欢迎使用 OA 系统';
    }

    // 安全守卫: 检查本地存储中是否存在 Supabase 的会话信息
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

    if (sessionError) {
        console.error('获取会话失败:', sessionError.message);
        // 即使获取会话失败，也跳转到登录页以确保安全
        window.location.href = '../../index.html';
        return;
    }

    if (!session) {
        // 如果没有会话 (用户未登录), 重定向到登录页
        alert('您尚未登录，请先登录。');
        window.location.href = '../../index.html';
        return;
    }

    // 如果用户已登录, 显示用户信息
    const user = session.user;
    if (user) {
        const userEmail = user.email;
        userInfo.textContent = userEmail;
    } else {
         // 理论上在有 session 的情况下 user 不会为 null，但作为健壮性检查
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
        // 成功登出后，重定向到登录页
        window.location.href = '../../index.html';
    }
}

// 3. 事件监听器初始化
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});
