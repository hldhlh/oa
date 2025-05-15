import { supabase } from './lib/supabaseClient.js';
import { checkUserSession, highlightNavigation } from './lib/common.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 检查用户会话，如果未登录则重定向到登录页
    const session = await checkUserSession();
    if (!session) {
        window.location.href = 'pages/login/index.html';
        return; // 如果没有会话，则停止执行后续代码
    }

    // 高亮当前导航链接 (如果此页面作为导航的一部分)
    // highlightNavigation(); // 首页可能不需要高亮自身

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('退出登录失败:', error.message);
                alert('退出登录失败，请稍后重试。');
            } else {
                alert('已成功退出登录！');
                window.location.href = 'pages/login/index.html'; // 跳转到登录页面
            }
        });
    }

    // 显示用户信息 (示例)
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && session.user) {
        userInfoElement.textContent = `欢迎您，${session.user.email}`;
        // 如果有更详细的用户信息 (例如从 profiles 表获取的姓名)，可以在这里展示
        // const { data: profile, error: profileError } = await supabase
        //     .from('profiles')
        //     .select('full_name')
        //     .eq('id', session.user.id)
        //     .single();
        // if (profile && profile.full_name) {
        //     userInfoElement.textContent = `欢迎您，${profile.full_name}`;
        // }
    }
}); 