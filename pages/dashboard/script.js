// 仪表盘页面特有的脚本逻辑

// 1. Supabase 客户端初始化
// 为了获取用户信息，此页面需要独立初始化 Supabase
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
// 直接使用 window.supabase，因为它是由父页面加载的
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

/**
 * 核心功能：更新欢迎信息
 */
async function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (!welcomeMessage) {
        console.log("未在仪表盘页面找到 'welcome-message' 元素。");
        return;
    };

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

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
}

document.addEventListener('DOMContentLoaded', updateWelcomeMessage);
