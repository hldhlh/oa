import { register } from '../../utils/auth.js';

const form = document.getElementById('register-form');
const errorMessageDiv = document.getElementById('error-message');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessageDiv.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = '注册中...';

    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const { error } = await register(email, password, { username: username });

        if (error) {
            errorMessageDiv.textContent = error.message;
        } else {
            alert('注册成功！请检查您的邮箱以完成验证。');
            window.location.hash = 'login'; // 注册成功，跳转到登录页
        }
    } catch (err) {
        errorMessageDiv.textContent = '发生意外错误，请重试。';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '注册';
    }
}); 