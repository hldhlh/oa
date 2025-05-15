import { supabase } from '../../lib/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageElement = document.getElementById('message');

    // 检查是否已经登录，如果登录了，则直接跳转到 dashboard
    // 这部分也可以放在 common.js 中，由 dashboard.js 调用
    if (localStorage.getItem('oa_user_info')) {
        // 可选：可以验证一下localStorage中的信息是否仍然有效
        // window.location.href = '../dashboard/index.html'; 
        // 暂时注释掉，因为 dashboard 页面还没有
        console.log('用户已登录，准备跳转到dashboard (当前被注释)');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 阻止表单默认提交行为

            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;

            if (!phone || !password) {
                messageElement.textContent = '手机号和密码不能为空！';
                messageElement.className = 'message error';
                return;
            }

            // 从 'profiles' 表中查询用户
            // 注意：这里的密码是明文比较，非常不安全。
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, phone, position, role, status') // 选择需要的字段
                .eq('phone', phone)
                .eq('password', password) // 直接比较明文密码，不安全
                .single(); // 假设手机号是唯一的，或者手机号+密码组合是唯一的

            if (error) {
                console.error('登录错误:', error);
                messageElement.textContent = '登录失败：手机号或密码错误。';
                // Supabase `single()` 在未找到记录时也会返回错误 (code PGRST116)，或者多条记录时也报错
                // if (error.code === 'PGRST116') { // Not Found
                //     messageElement.textContent = '登录失败：手机号或密码错误。';
                // }
                messageElement.className = 'message error';
            } else if (data) {
                if (data.status !== 'active') {
                    messageElement.textContent = '登录失败：该账户已被禁用。';
                    messageElement.className = 'message error';
                    return;
                }

                messageElement.textContent = '登录成功！正在跳转...';
                messageElement.className = 'message success';

                // 存储用户信息到 localStorage
                // 注意：localStorage 中的数据可以被XSS攻击获取，敏感信息需谨慎处理
                localStorage.setItem('oa_user_info', JSON.stringify(data));

                // 更新 last_login 时间 (异步操作，不阻塞跳转)
                supabase
                    .from('profiles')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.id)
                    .then(({ error: updateError }) => {
                        if (updateError) {
                            console.error('更新最后登录时间失败:', updateError);
                        }
                    });

                // 登录成功后跳转到 dashboard 页面
                // 实际项目中，dashboard 页面会检查登录状态
                setTimeout(() => {
                    window.location.href = '../dashboard/index.html'; // TODO: 创建 dashboard 页面
                }, 1000);

            } else {
                 // 如果 data 为 null 且 error 也为 null (理论上不应该发生，除非.single()行为有变)
                 messageElement.textContent = '登录失败：手机号或密码错误。';
                 messageElement.className = 'message error';
            }
        });
    }
}); 