// 初始化Materialize组件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页
    const tabsElem = document.querySelector('.tabs');
    M.Tabs.init(tabsElem);
    
    // 监听登录表单提交
    const loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 监听注册表单提交
    const registerForm = document.getElementById('register');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 初始化下拉选择框
    const selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
});

// 处理登录表单提交
async function handleLogin(e) {
    e.preventDefault();
    
    // 获取表单数据
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    
    // 表单验证
    if (!phone || !password) {
        showToast('请填写完整信息', 'red');
        return;
    }
    
    try {
        // 登录前显示加载状态
        document.querySelector('button[type="submit"]').disabled = true;
        
        // 使用Supabase进行登录
        const { data, error } = await supabase.auth.signInWithPassword({
            email: `${phone}@jingling.com`, // 使用手机号作为邮箱前缀
            password: password
        });
        
        // 恢复按钮状态
        document.querySelector('button[type="submit"]').disabled = false;
        
        if (error) {
            showToast('登录失败: ' + error.message, 'red');
        } else {
            // 登录成功，更新最后登录时间
            await updateLastLogin(data.user.id);
            
            // 跳转到仪表盘
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        document.querySelector('button[type="submit"]').disabled = false;
        showToast('登录失败，请重试', 'red');
        console.error('登录错误:', error);
    }
}

// 处理注册表单提交
async function handleRegister(e) {
    e.preventDefault();
    
    // 获取表单数据
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('reg_phone').value;
    const password = document.getElementById('reg_password').value;
    const position = document.getElementById('position').value;
    
    // 表单验证
    if (!fullname || !phone || !password || !position) {
        showToast('请填写完整信息', 'red');
        return;
    }
    
    try {
        // 注册前显示加载状态
        document.querySelector('#register button[type="submit"]').disabled = true;
        
        // 使用Supabase进行注册
        const { data, error } = await supabase.auth.signUp({
            email: `${phone}@jingling.com`, // 使用手机号作为邮箱前缀
            password: password,
            options: {
                data: {
                    full_name: fullname,
                    phone: phone,
                    position: position
                }
            }
        });
        
        // 恢复按钮状态
        document.querySelector('#register button[type="submit"]').disabled = false;
        
        if (error) {
            showToast('注册失败: ' + error.message, 'red');
        } else {
            // 创建用户资料
            await createUserProfile(data.user.id, fullname, phone, position);
            
            // 显示成功消息
            showToast('注册成功，请登录', 'green');
            
            // 切换到登录标签页
            const tabsInstance = M.Tabs.getInstance(document.querySelector('.tabs'));
            tabsInstance.select('login-form');
            
            // 清空注册表单
            document.getElementById('register').reset();
        }
    } catch (error) {
        document.querySelector('#register button[type="submit"]').disabled = false;
        showToast('注册失败，请重试', 'red');
        console.error('注册错误:', error);
    }
}

// 创建用户资料
async function createUserProfile(userId, fullName, phone, position) {
    try {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                full_name: fullName,
                phone: phone,
                position: position,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            });
            
        if (error) throw error;
    } catch (error) {
        console.error('创建用户资料失败:', error);
    }
}

// 更新最后登录时间
async function updateLastLogin(userId) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                last_login: new Date().toISOString() 
            })
            .eq('id', userId);
            
        if (error) throw error;
    } catch (error) {
        console.error('更新登录时间失败:', error);
    }
} 