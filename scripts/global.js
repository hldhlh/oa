/**
 * global.js - 全局配置与共享函数
 */

// Supabase配置
const SUPABASE_CONFIG = {
    url: 'https://qdcdhxlguuoksfhelywt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM'
};

/**
 * 创建Supabase客户端实例
 * @returns {Object} Supabase客户端实例
 */
function createSupabaseClient() {
    return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

/**
 * 通用消息提示函数
 * @param {string} message - 要显示的消息
 * @param {string} [type='info'] - 消息类型 (info, success, error)
 * @param {number} [duration=3000] - 显示时长 (毫秒)
 */
function showMessage(message, type = 'info', duration = 3000) {
    const existingToast = document.querySelector('.toast-notification, .mesg-box');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 根据环境使用不同的消息样式
    if (document.querySelector('.dashboard-wrapper')) {
        // main.html环境
        const mesg = document.createElement('div');
        mesg.className = `mesg-box ${type}`;
        mesg.textContent = message;
        document.body.appendChild(mesg);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mesg.classList.add('visible');
            });
        });
        
        setTimeout(() => {
            mesg.classList.remove('visible');
            mesg.addEventListener('transitionend', () => mesg.remove());
        }, duration);
    } else {
        // index.html环境
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }
}

// 导出全局对象
window.OA = {
    supabase: null, // 将在使用时初始化
    config: SUPABASE_CONFIG,
    createClient: createSupabaseClient,
    showMessage: showMessage
};
