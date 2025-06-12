import { register } from '../../utils/auth.js';
import { validateForm, showNotification } from '../../utils/helpers.js';
import { createButton, createInput, createAlert } from '../../components/ui.js';
import { translateErrorMessage } from '../../utils/errorMessages.js';
import { navigateTo } from '../../app.js';

// 注册页面渲染函数
export default function renderRegisterPage(container) {
    // 创建注册页面内容
    container.innerHTML = `
        <div class="flex justify-center items-center py-12">
            <div class="bg-white rounded-2xl shadow-neumorphism p-8 w-full max-w-md">
                <div class="text-center mb-8">
                    <div class="inline-block p-3 bg-primary bg-opacity-20 rounded-full mb-4">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-user"></use>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800">注册账号</h1>
                    <p class="text-gray-600 mt-2">创建您的账号，开始使用OA系统</p>
                </div>
                
                <div id="register-form" class="space-y-6">
                    <div id="username-input"></div>
                    <div id="email-input"></div>
                    <div id="password-input"></div>
                    <div id="confirm-password-input"></div>
                    
                    <div class="flex items-center">
                        <input id="agree-terms" type="checkbox" class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                        <label for="agree-terms" class="ml-2 block text-sm text-gray-700">
                            我已阅读并同意 <a href="#" class="text-primary hover:underline">服务条款</a> 和 <a href="#" class="text-primary hover:underline">隐私政策</a>
                        </label>
                    </div>
                    
                    <div id="register-button" class="mt-6"></div>
                    
                    <div class="text-center mt-4">
                        <p class="text-sm text-gray-600">
                            已有账号? <a href="/login" class="text-primary hover:underline">立即登录</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 表单状态
    const formState = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
        errors: {},
        isLoading: false
    };
    
    // 创建用户名输入框
    const usernameInput = createInput({
        type: 'text',
        placeholder: '请输入用户名',
        label: '用户名',
        required: true,
        id: 'username',
        name: 'username',
        onChange: (e) => {
            formState.username = e.target.value;
            validateRegisterForm();
        }
    });
    
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
            validateRegisterForm();
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
            validateRegisterForm();
        }
    });
    
    // 创建确认密码输入框
    const confirmPasswordInput = createInput({
        type: 'password',
        placeholder: '请再次输入密码',
        label: '确认密码',
        required: true,
        id: 'confirm-password',
        name: 'confirm-password',
        onChange: (e) => {
            formState.confirmPassword = e.target.value;
            validateRegisterForm();
        }
    });
    
    // 创建注册按钮
    const registerButton = createButton({
        text: '注册',
        type: 'primary',
        fullWidth: true,
        onClick: handleRegister
    });
    
    // 添加到页面
    document.getElementById('username-input').appendChild(usernameInput);
    document.getElementById('email-input').appendChild(emailInput);
    document.getElementById('password-input').appendChild(passwordInput);
    document.getElementById('confirm-password-input').appendChild(confirmPasswordInput);
    document.getElementById('register-button').appendChild(registerButton);
    
    // 同意条款复选框事件
    document.getElementById('agree-terms').addEventListener('change', (e) => {
        formState.agreeTerms = e.target.checked;
        validateRegisterForm();
    });
    
    // 表单验证
    function validateRegisterForm() {
        const { isValid, errors } = validateForm(
            {
                username: formState.username,
                email: formState.email,
                password: formState.password,
                confirmPassword: formState.confirmPassword
            },
            {
                username: {
                    required: true
                },
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '请输入有效的邮箱地址'
                },
                password: {
                    required: true
                },
                confirmPassword: {
                    required: true,
                    match: 'password',
                    message: '两次输入的密码不一致'
                }
            }
        );
        
        formState.errors = errors;
        return isValid && formState.agreeTerms;
    }
    
    // 处理注册
    async function handleRegister() {
        // 验证表单
        if (!validateRegisterForm()) {
            // 显示错误信息
            if (!formState.agreeTerms) {
                showNotification('请阅读并同意服务条款和隐私政策', 'error');
                return;
            }
            
            for (const key in formState.errors) {
                if (formState.errors[key]) {
                    showNotification(formState.errors[key], 'error');
                    return;
                }
            }
            
            return;
        }
        
        // 设置加载状态
        formState.isLoading = true;
        registerButton.textContent = '注册中...';
        registerButton.disabled = true;
        
        try {
            // 调用注册API
            const { data, error } = await register(
                formState.email,
                formState.password,
                {
                    username: formState.username,
                    role: 'user'
                }
            );
            
            if (error) {
                throw error;
            }
            
            // 注册成功
            showNotification('注册成功，请登录您的账号', 'success');
            
            // 延迟跳转到登录页，使用SPA导航
            setTimeout(() => {
                navigateTo('/login');
            }, 1500);
        } catch (error) {
            console.error('注册失败:', error);
            
            // 翻译错误消息
            const errorMessage = translateErrorMessage(error.message) || '注册失败，请重试';
            
            // 创建错误提示
            const errorAlert = createAlert({
                title: '注册失败',
                message: errorMessage,
                type: 'error'
            });
            
            // 添加到表单上方
            const form = document.getElementById('register-form');
            form.prepend(errorAlert);
        } finally {
            // 恢复按钮状态
            formState.isLoading = false;
            registerButton.textContent = '注册';
            registerButton.disabled = false;
        }
    }
    
    // 添加回车键提交表单
    container.querySelector('#confirm-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    });
} 