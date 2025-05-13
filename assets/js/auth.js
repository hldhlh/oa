/**
 * 今岭火锅店OA系统 - 认证模块
 * 版本: 1.0.7
 * 最后更新: 2024-05-13
 */

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
    
    // 显示版本信息
    console.log('认证模块版本: 1.0.7');
});

/**
 * 处理员工登录
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // 获取表单数据
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    
    // 表单验证
    if (!phone || !password) {
        // 使用错误面板显示
        if (window.showErrorPanel) {
            window.showErrorPanel('手机号或密码错误');
        } else {
            showToast('手机号或密码错误', 'red');
        }
        return;
    }
    
    try {
        // 登录前显示加载状态
        const submitButton = document.querySelector('#login button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="material-icons left">hourglass_empty</i>登录中...';
        
        // 直接查询profiles表中的用户信息和密码
        const { data: user, error: userError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .eq('password', password)  // 直接比较密码字段
            .maybeSingle();
        
        // 恢复按钮状态
        submitButton.disabled = false;
        submitButton.innerHTML = '登录 <i class="material-icons right">send</i>';
        
        if (userError) {
            console.error('查询用户信息失败:', userError);
            // 使用错误面板显示
            if (window.showErrorPanel) {
                window.showErrorPanel('登录失败，系统错误');
            } else {
                showToast('登录失败，系统错误', 'red');
            }
            return;
        }
        
        if (!user) {
            // 使用错误面板显示
            if (window.showErrorPanel) {
                window.showErrorPanel('手机号或密码错误');
            } else {
                showToast('手机号或密码错误', 'red');
            }
            return;
        }
        
        // 登录成功，设置会话信息
        // 使用localStorage存储用户信息
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // 更新最后登录时间
        await updateLastLogin(user.id);
        
        // 显示成功消息
        showToast('登录成功！', 'green');
        
        // 跳转到仪表盘
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        submitButton.disabled = false;
        submitButton.innerHTML = '登录 <i class="material-icons right">send</i>';
        // 使用错误面板显示
        if (window.showErrorPanel) {
            window.showErrorPanel('登录失败，请重试');
        } else {
            showToast('登录失败，请重试', 'red');
        }
        console.error('登录错误:', error);
    }
}

/**
 * 处理新员工注册
 */
async function handleRegister(e) {
    e.preventDefault();
    
    // 获取表单数据
    const fullname = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('reg_phone').value.trim();
    const password = document.getElementById('reg_password').value;
    const position = document.getElementById('position').value;
    
    // 表单验证
    if (!fullname || !phone || !password || !position) {
        // 使用错误面板显示
        if (window.showErrorPanel) {
            window.showErrorPanel('请填写完整信息');
        } else {
            showToast('请填写完整信息', 'red');
        }
        return;
    }
    
    try {
        // 注册前显示加载状态
        const submitButton = document.querySelector('#register button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="material-icons left">hourglass_empty</i>注册中...';
        
        // 检查手机号是否已存在
        const { data: existingProfile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
            
        if (profileError) {
            console.error('检查手机号是否存在时出错:', profileError);
            // 非关键错误，继续执行
        }
        
        if (existingProfile) {
            submitButton.disabled = false;
            submitButton.innerHTML = '注册 <i class="material-icons right">person_add</i>';
            // 使用错误面板显示
            if (window.showErrorPanel) {
                window.showErrorPanel('手机号已被注册，请直接登录或使用其他手机号');
            } else {
                showToast('手机号已被注册，请直接登录或使用其他手机号', 'red');
            }
            return;
        }
        
        // 修改注册方式，先插入基本数据
        const { error: insertError } = await window.supabaseClient
            .from('profiles')
            .insert({
                full_name: fullname,
                phone: phone,
                password: password,
                position: position,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            });
        
        if (insertError) {
            submitButton.disabled = false;
            submitButton.innerHTML = '注册 <i class="material-icons right">person_add</i>';
            console.error('创建用户错误:', insertError);
            // 使用错误面板显示
            if (window.showErrorPanel) {
                window.showErrorPanel('注册失败: ' + insertError.message);
            } else {
                showToast('注册失败: ' + insertError.message, 'red');
            }
            return;
        }
        
        // 插入成功后，查询刚刚创建的用户信息
        const { data: userData, error: queryError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
            
        if (queryError) {
            console.error('查询新用户信息失败:', queryError);
            // 非关键错误，继续执行
        }
        
        // 恢复按钮状态
        submitButton.disabled = false;
        submitButton.innerHTML = '注册 <i class="material-icons right">person_add</i>';
        
        // 显示成功消息
        showToast('注册成功，请登录', 'green');
        
        // 切换到登录标签页
        const tabsInstance = M.Tabs.getInstance(document.querySelector('.tabs'));
        tabsInstance.select('login-form');
        
        // 自动填充登录表单
        document.getElementById('phone').value = phone;
        
        // 清空注册表单
        document.getElementById('register').reset();
    } catch (error) {
        document.querySelector('#register button[type="submit"]').disabled = false;
        document.querySelector('#register button[type="submit"]').innerHTML = '注册 <i class="material-icons right">person_add</i>';
        // 使用错误面板显示
        if (window.showErrorPanel) {
            window.showErrorPanel('注册失败，请重试');
        } else {
            showToast('注册失败，请重试', 'red');
        }
        console.error('注册错误:', error);
    }
}

/**
 * 更新最后登录时间
 */
async function updateLastLogin(userId) {
    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ 
                last_login: new Date().toISOString() 
            })
            .eq('id', userId);
            
        if (error) {
            console.error('更新登录时间错误:', error);
            throw error;
        }
        
        return true;
    } catch (error) {
        console.error('更新登录时间失败:', error);
        return false;
    }
} 