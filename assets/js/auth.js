// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 确保Supabase已初始化
    await supabasePromise;
    
    // 检查用户是否已登录
    const user = await checkUserSession();
    
    // 如果用户已登录且当前在登录页面，则重定向到仪表盘
    if (user && window.location.pathname.includes('index.html')) {
        redirectToDashboard();
        return;
    }
    
    // 设置登录表单提交事件
    setupLoginForm();
    
    // 设置忘记密码表单提交事件
    setupForgotPasswordForm();
    
    // 设置注册表单提交事件
    setupRegisterForm();
});

// 设置登录表单提交事件
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 设置注册链接点击事件
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        const supabase = window.supabase;
        
        // 显示加载状态
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // 登录成功，重定向到仪表盘
        Toast.success('登录成功，正在跳转...');
        setTimeout(() => {
            redirectToDashboard();
        }, 1000);
    } catch (error) {
        console.error('登录失败:', error);
        
        // 显示错误消息
        Toast.error('登录失败: ' + error.message);
        
        // 恢复按钮状态
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '登录';
    }
}

// 设置忘记密码表单提交事件
function setupForgotPasswordForm() {
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const loginForm = document.getElementById('login-form');
    const backToLoginLink = document.getElementById('back-to-login');
    
    if (forgotPasswordLink && forgotPasswordForm && loginForm) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            forgotPasswordForm.style.display = 'block';
        });
        
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
}

// 处理忘记密码
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    
    try {
        const supabase = window.supabase;
        
        // 显示加载状态
        const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '发送中...';
        
        // 发送重置密码邮件
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        // 显示成功消息
        Toast.success('重置密码邮件已发送，请检查您的邮箱');
        
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    } catch (error) {
        console.error('发送重置密码邮件失败:', error);
        
        // 显示错误消息
        Toast.error('发送失败: ' + error.message);
        
        // 恢复按钮状态
        const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '发送重置链接';
    }
}

// 设置注册表单提交事件
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const backToLoginLink = document.getElementById('back-to-login-from-register');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 验证姓名长度
    if (name.length < 2) {
        Toast.error('姓名长度至少需要2个字符');
        return;
    }
    
    // 验证密码
    if (password !== confirmPassword) {
        Toast.error('两次输入的密码不一致');
        return;
    }
    
    try {
        const supabase = window.supabase;
        
        // 显示加载状态
        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';
        
        // 注册用户
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        try {
            // 创建用户资料
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id,
                        full_name: name,
                        email: email
                    }
                ]);
                
            if (profileError) {
                console.error('创建资料失败:', profileError);
                if (profileError.message.includes('full_name_length')) {
                    throw new Error('姓名长度不符合要求，至少需要2个字符');
                }
            }
        } catch (profileError) {
            console.error('创建资料时出错:', profileError);
            // 继续执行，不中断注册流程
        }
        
        // 显示成功消息并切换到登录表单
        Toast.success('注册成功，请登录');
        setTimeout(() => {
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }, 1500);
        
    } catch (error) {
        console.error('注册失败:', error);
        
        // 显示错误消息
        Toast.error('注册失败: ' + (error.message || '请稍后再试'));
        
        // 恢复按钮状态
        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '注册';
    }
}
