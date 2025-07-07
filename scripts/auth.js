/**
 * ==============================================================================
 * !! 重要安全警告 !!
 * ==============================================================================
 * 本文件中的 `supabaseUrl` 和 `supabaseKey` (anon key) 是故意暴露在客户端的。
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

// 1. Supabase 客户端初始化
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. DOM 元素获取
const elements = {
    formTitle: document.getElementById('form-title'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    toggleToRegister: document.getElementById('toggle-to-register'),
    toggleToLogin: document.getElementById('toggle-to-login'),
    inputs: document.querySelectorAll('#login-form input, #register-form input'),
};

/**
 * 通用消息提示函数
 * @param {string} message - 要显示的消息
 * @param {number} [duration=3000] - 显示时长 (毫秒)
 */
function showMesg(message, duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

/**
 * 更新认证视图 (登录/注册)
 * @param {'login' | 'register'} view 要显示的视图
 */
function updateAuthView(view) {
    if (view === 'login') {
        elements.registerForm.style.display = 'none';
        elements.toggleToLogin.style.display = 'none';
        elements.loginForm.style.display = 'block';
        elements.toggleToRegister.style.display = 'block';
        elements.formTitle.textContent = 'OA 系统登录';
    } else {
        elements.loginForm.style.display = 'none';
        elements.toggleToRegister.style.display = 'none';
        elements.registerForm.style.display = 'block';
        elements.toggleToLogin.style.display = 'block';
        elements.formTitle.textContent = '创建您的账户';
    }
}

/**
 * 处理用户登录
 * @param {Event} event 表单提交事件
 */
async function handleLogin(event) {
    event.preventDefault();
    const email = elements.loginForm.email.value;
    const password = elements.loginForm.password.value;

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showMesg(`登录失败: ${error.message}`);
    } else {
        showMesg('登录成功！即将跳转到主页...');
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 1500); // 延迟1.5秒以便用户看到消息
    }
}

/**
 * 处理用户注册
 * @param {Event} event 表单提交事件
 */
async function handleRegister(event) {
    event.preventDefault();
    const email = elements.registerForm.email.value;
    const password = elements.registerForm.password.value;
    const confirmPassword = elements.registerForm['confirm-password'].value;

    if (password !== confirmPassword) {
        showMesg('两次输入的密码不匹配，请重新输入。');
        return;
    }
    
    if (password.length < 6) {
        showMesg('密码长度不能少于6位。');
        return;
    }

    const { data, error } = await _supabase.auth.signUp({ email, password });

    if (error) {
        showMesg(`注册失败: ${error.message}`);
    } else {
        showMesg('注册成功！现在可以返回登录了。');
        setTimeout(() => {
            updateAuthView('login'); // 切换回登录视图
            elements.loginForm.email.value = email; // 自动填充邮箱
            elements.loginForm.password.value = ''; // 清空密码
        }, 1500);
    }
}

// 3. 事件监听器初始化
document.addEventListener('DOMContentLoaded', () => {
    elements.toggleToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        updateAuthView('register');
    });

    elements.toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        updateAuthView('login');
    });

    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);

    // 用户开始输入时，隐藏消息
    elements.inputs.forEach(input => {
        input.addEventListener('focus', () => {
            // No need to hide toast manually, it auto-dismisses.
        });
    });

    // 初始视图为登录
    updateAuthView('login');
});
