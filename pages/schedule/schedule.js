import { supabase } from '../../lib/supabaseClient.js';
import { checkAuthState, applyNavHighlighting } from '../../lib/common.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState(); // 检查登录状态，未登录则跳转到登录页
    applyNavHighlighting(); // 应用导航高亮

    console.log('排班管理页面加载完成。');

    // 后续将在这里添加排班相关的逻辑，例如：
    // - 获取排班数据
    // - 展示排班日历或列表
    // - 允许有权限的用户创建、修改、删除排班
    // - 处理用户交互等

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('退出登录失败:', error);
                alert('退出登录失败！');
            } else {
                localStorage.removeItem('oa_user_info');
                window.location.href = '../login/index.html';
            }
        });
    }
}); 