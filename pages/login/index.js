import { login } from '../../utils/auth.js';
import { validateForm, showNotification } from '../../utils/helpers.js';
import { createButton, createInput, createAlert } from '../../components/ui.js';
import { translateErrorMessage } from '../../utils/errorMessages.js';
import { navigateTo } from '../../app.js';

// 登录页面渲染函数
export default function renderLoginPage(container) {
    // 创建登录页面内容
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="bg-white rounded-2xl content-card p-8 w-full max-w-md">
                <div class="text-center mb-8">
                    <div class="inline-block p-3 bg-primary bg-opacity-20 rounded-full mb-4">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-user"></use>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800">登录</h1>
                    <p class="text-gray-600 mt-2">欢迎回来，请登录您的账号</p>
                </div>
                
                <div id="login-form" class="space-y-6">
                    <div id="email-input"></div>
                    <div id="password-input"></div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input id="remember-me" type="checkbox" class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                            <label for="remember-me" class="ml-2 block text-sm text-gray-700">记住我</label>
                        </div>
                        <div>
                            <a href="#" class="text-sm text-primary hover:underline">忘记密码?</a>
                        </div>
                    </div>
                    
                    <div id="login-button" class="mt-6"></div>
                    
                    <div class="text-center mt-4">
                        <p class="text-sm text-gray-600">
                            还没有账号? <a href="/register" class="text-primary hover:underline">立即注册</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 表单状态
    const formState = {
        email: '',
        password: '',
        errors: {},
        isLoading: false
    };
    
    // 创建邮箱输入框
    const emailInput = createInput({
        type: 'email',
        placeholder: '请输入邮箱地址',
        label: '邮箱地址',
        required: true,
        id: 'email',
        name: 'email',
        onChange: (e) => {
            formState.email = e.target.value;
            validateLoginForm();
        }
    });
    
    // 创建密码输入框
    const passwordInput = createInput({
        type: 'password',
        placeholder: '请输入密码',
        label: '密码',
        required: true,
        id: 'password',
        name: 'password',
        onChange: (e) => {
            formState.password = e.target.value;
            validateLoginForm();
        }
    });
    
    // 创建登录按钮
    const loginButton = createButton({
        text: '登录',
        type: 'primary',
        fullWidth: true,
        onClick: handleLogin
    });
    
    // 添加到页面
    document.getElementById('email-input').appendChild(emailInput);
    document.getElementById('password-input').appendChild(passwordInput);
    document.getElementById('login-button').appendChild(loginButton);
    
    // 表单验证
    function validateLoginForm() {
        const { isValid, errors } = validateForm(
            { email: formState.email, password: formState.password },
            {
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址'
                },
                password: {
                    required: true
                }
            }
        );
        
        formState.errors = errors;
        return isValid;
    }
    
    // 处理登录
    async function handleLogin() {
        // 验证表单
        if (!validateLoginForm()) {
            // 显示错误信息
            if (formState.errors.email) {
                showNotification(formState.errors.email, 'error');
            }
            
            if (formState.errors.password) {
                showNotification(formState.errors.password, 'error');
            }
            
            return;
        }
        
        // 设置加载状态
        formState.isLoading = true;
        loginButton.textContent = '登录中...';
        loginButton.disabled = true;
        
        try {
            // 调用登录API
            const { data, error } = await login(formState.email, formState.password);
            
            if (error) {
                throw error;
            }
            
            // 登录成功
            showNotification('登录成功，正在跳转...', 'success');
            
            // 延迟跳转
            setTimeout(() => {
                navigateTo('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('登录失败:', error);
            
            // 翻译错误消息
            const errorMessage = translateErrorMessage(error.message) || '邮箱或密码错误，请重试';
            
            // 创建错误提示
            const errorAlert = createAlert({
                title: '登录失败',
                message: errorMessage,
                type: 'error'
            });
            
            // 添加到表单上方
            const form = document.getElementById('login-form');
            form.prepend(errorAlert);
        } finally {
            // 恢复按钮状态
            formState.isLoading = false;
            loginButton.textContent = '登录';
            loginButton.disabled = false;
        }
    }
    
    // 添加回车键提交表单
    container.querySelector('#password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
} 