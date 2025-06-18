import { login } from '../../utils/auth.js';

const form = document.getElementById('login-form');
const errorMessageDiv = document.getElementById('error-message');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessageDiv.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = '登录中...';

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const { error } = await login(email, password);

        if (error) {
            errorMessageDiv.textContent = error.message;
        } else {
            // 路由守卫会在 hash change 时处理跳转
            window.location.hash = '';
        }
    } catch (err) {
        errorMessageDiv.textContent = '发生意外错误，请重试。';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '登录';
    }
}); 