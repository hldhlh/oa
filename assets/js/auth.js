// 认证相关功能
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // 切换到注册表单
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function() {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
    }

    // 切换到登录表单
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function() {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // 登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showMessage('请填写完整的登录信息', 'error');
                return;
            }

            // 显示加载状态
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    throw error;
                }

                showMessage('登录成功！正在跳转...', 'success');

                // 延迟跳转，让用户看到成功消息
                setTimeout(() => {
                    const dashboardPath = window.location.pathname.includes('/pages/') ? '../../dashboard.html' : 'dashboard.html';
                    window.location.href = dashboardPath;
                }, 1000);

            } catch (error) {
                console.error('登录错误:', error);
                let errorMessage = '登录失败，请检查邮箱和密码';
                
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = '邮箱或密码错误';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = '请先验证您的邮箱';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = '请求过于频繁，请稍后再试';
                }
                
                showMessage(errorMessage, 'error');
            } finally {
                // 恢复按钮状态
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        });
    }

    // 注册表单提交
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            // 表单验证
            if (!name || !email || !password || !confirmPassword) {
                showMessage('请填写完整的注册信息', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showMessage('两次输入的密码不一致', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage('密码长度至少为6位', 'error');
                return;
            }

            // 邮箱格式验证
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('请输入有效的邮箱地址', 'error');
                return;
            }

            // 显示加载状态
            registerBtn.disabled = true;
            registerBtn.textContent = '注册中...';

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            name: name,
                            role: 'employee' // 默认角色为员工
                        }
                    }
                });

                if (error) {
                    throw error;
                }

                showMessage('注册成功！请检查邮箱验证链接', 'success');
                
                // 清空表单
                registerForm.reset();
                
                // 切换到登录表单
                setTimeout(() => {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                }, 2000);

            } catch (error) {
                console.error('注册错误:', error);
                let errorMessage = '注册失败，请稍后重试';
                
                if (error.message.includes('User already registered')) {
                    errorMessage = '该邮箱已被注册';
                } else if (error.message.includes('Password should be at least 6 characters')) {
                    errorMessage = '密码长度至少为6位';
                } else if (error.message.includes('Unable to validate email address')) {
                    errorMessage = '邮箱地址格式不正确';
                }
                
                showMessage(errorMessage, 'error');
            } finally {
                // 恢复按钮状态
                registerBtn.disabled = false;
                registerBtn.textContent = '注册账号';
            }
        });
    }
});

// 登出功能
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        
        showMessage('已成功登出', 'success');
        const indexPath = window.location.pathname.includes('/pages/') ? '../../index.html' : 'index.html';
        window.location.href = indexPath;
    } catch (error) {
        console.error('登出错误:', error);
        showMessage('登出失败，请重试', 'error');
    }
}

// 获取当前用户信息
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            throw error;
        }
        return user;
    } catch (error) {
        console.error('获取用户信息错误:', error);
        return null;
    }
}

// 更新用户资料
async function updateUserProfile(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('更新用户资料错误:', error);
        throw error;
    }
}

// 重置密码
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('重置密码错误:', error);
        throw error;
    }
}

// 导出函数供全局使用
window.authFunctions = {
    signOut,
    getCurrentUser,
    updateUserProfile,
    resetPassword
};

// 同时将getCurrentUser导出为全局函数，方便其他模块使用
window.getCurrentUser = getCurrentUser;
