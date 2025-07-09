/**
 * ==============================================================================
 * !! 重要安全警告 !!
 * ==============================================================================
 * 本文件中的 Supabase 相关配置是故意暴露在客户端的。
 * 这是 Supabase 前端集成的标准做法之一。
 *
 * !!! 整个应用的安全性完全依赖于后端严格的行级安全 (RLS) 策略 !!!
 *
 * 开发准则:
 * 1. **必须** 为所有存储敏感数据的新建数据表启用 RLS。
 * 2. **必须** 为每张启用 RLS 的表创建合理的安全策略 (Policy)，以控制
 *    `SELECT`, `INSERT`, `UPDATE`, `DELETE` 权限。
 * 3. 定期使用 Supabase 后台的 "SQL Editor" -> "Roles" 和 "Policies"
 *    以及 "Advisors" 功能，审查安全配置。
 *
 * 如果不遵循以上准则，将导致严重的数据泄露风险。
 * ==============================================================================
 */

// 等待DOM和全局资源加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化Supabase客户端
    const _supabase = window.OA.createClient();
    window.OA.supabase = _supabase;

    // DOM 元素缓存
    const UI = {
        formTitle: document.getElementById('form-title'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        toggleToRegister: document.getElementById('toggle-to-register'),
        toggleToLogin: document.getElementById('toggle-to-login'),
        loginInputs: {
            email: document.getElementById('login-email'),
            password: document.getElementById('login-password')
        },
        registerInputs: {
            email: document.getElementById('register-email'),
            password: document.getElementById('register-password'),
            confirmPassword: document.getElementById('confirm-password')
        }
    };

    /**
     * 更新认证视图 (登录/注册)
     * @param {'login' | 'register'} view 要显示的视图
     */
    function updateAuthView(view) {
        const isLogin = view === 'login';
        
        UI.registerForm.style.display = isLogin ? 'none' : 'block';
        UI.toggleToLogin.style.display = isLogin ? 'none' : 'block';
        UI.loginForm.style.display = isLogin ? 'block' : 'none';
        UI.toggleToRegister.style.display = isLogin ? 'block' : 'none';
        UI.formTitle.textContent = isLogin ? 'OA 系统登录' : '创建您的账户';
    }

    /**
     * 处理用户登录
     * @param {Event} event 表单提交事件
     */
    async function handleLogin(event) {
        event.preventDefault();
        
        const email = UI.loginInputs.email.value;
        const password = UI.loginInputs.password.value;

        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

        if (error) {
            window.OA.showMessage(`登录失败: ${error.message}`, 'error');
        } else {
            window.OA.showMessage('登录成功！即将跳转到主页...', 'success');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
        }
    }

    /**
     * 处理用户注册
     * @param {Event} event 表单提交事件
     */
    async function handleRegister(event) {
        event.preventDefault();
        
        const email = UI.registerInputs.email.value;
        const password = UI.registerInputs.password.value;
        const confirmPassword = UI.registerInputs.confirmPassword.value;

        if (password !== confirmPassword) {
            window.OA.showMessage('两次输入的密码不匹配，请重新输入。', 'error');
            return;
        }
        
        if (password.length < 6) {
            window.OA.showMessage('密码长度不能少于6位。', 'error');
            return;
        }

        const { data, error } = await _supabase.auth.signUp({ email, password });

        if (error) {
            window.OA.showMessage(`注册失败: ${error.message}`, 'error');
        } else {
            window.OA.showMessage('注册成功！现在可以返回登录了。', 'success');
            setTimeout(() => {
                updateAuthView('login'); // 切换回登录视图
                UI.loginInputs.email.value = email; // 自动填充邮箱
                UI.loginInputs.password.value = ''; // 清空密码
            }, 1000);
        }
    }

    // 使用事件委托优化点击事件
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#toggle-to-register')) {
            e.preventDefault();
            updateAuthView('register');
        } else if (e.target.closest('#toggle-to-login')) {
            e.preventDefault();
            updateAuthView('login');
        }
    });

    UI.loginForm.addEventListener('submit', handleLogin);
    UI.registerForm.addEventListener('submit', handleRegister);

    // 初始视图为登录
    updateAuthView('login');
});
