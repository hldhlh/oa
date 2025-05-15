import { supabase } from '../../lib/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const messageElement = document.getElementById('message');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 阻止表单默认提交行为

            const fullName = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;
            const position = document.getElementById('position').value;
            const password = document.getElementById('password').value;

            // 基础的前端校验
            if (!fullName || !phone || !password) {
                messageElement.textContent = '姓名、手机号和密码不能为空！';
                messageElement.className = 'message error';
                return;
            }

            // 尝试将用户数据插入 'profiles' 表
            // 注意：这里的密码是明文存储的，非常不安全。生产环境应进行哈希处理。
            const { data, error } = await supabase
                .from('profiles')
                .insert([
                    {
                        full_name: fullName,
                        phone: phone,
                        position: position,
                        password: password, // 再次强调：明文密码，不安全
                        // status 和 role 使用数据库默认值
                        // last_password_change 可以考虑在修改密码时设置
                    }
                ])
                .select(); // Supabase v2 需要 .select() 来返回插入的数据

            if (error) {
                console.error('注册错误:', error);
                messageElement.textContent = `注册失败: ${error.message}`;
                // 检查是否因为手机号已存在 (这需要数据库有唯一约束，错误代码通常是 '23505')
                if (error.code === '23505') { // PostgreSQL unique violation
                    messageElement.textContent = '注册失败: 该手机号已被注册。';
                }
                messageElement.className = 'message error';
            } else if (data && data.length > 0) {
                messageElement.textContent = '注册成功！请前往登录页面。';
                messageElement.className = 'message success';
                signupForm.reset(); // 清空表单
                // 可以在这里添加延迟后跳转到登录页
                // setTimeout(() => {
                //     window.location.href = '../login/index.html';
                // }, 2000);
            } else {
                // 理论上，如果error为null，data应该有数据。这里作为额外检查。
                messageElement.textContent = '注册过程中发生未知错误。';
                messageElement.className = 'message error';
            }
        });
    }
}); 