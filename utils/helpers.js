// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

// 表单验证
export function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const fieldRules = rules[field];
        
        if (fieldRules.required && (!value || value.trim() === '')) {
            errors[field] = '此字段为必填项';
            continue;
        }
        
        if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
            errors[field] = `此字段至少需要${fieldRules.minLength}个字符`;
            continue;
        }
        
        if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
            errors[field] = `此字段最多允许${fieldRules.maxLength}个字符`;
            continue;
        }
        
        if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
            errors[field] = fieldRules.message || '此字段格式不正确';
            continue;
        }
        
        if (fieldRules.match && formData[fieldRules.match] !== value) {
            errors[field] = '两次输入不匹配';
            continue;
        }
        
        if (fieldRules.custom && typeof fieldRules.custom === 'function') {
            const customError = fieldRules.custom(value, formData);
            if (customError) {
                errors[field] = customError;
                continue;
            }
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// 显示通知
export function showNotification(message, type = 'info', duration = 3000) {
    // 检查是否已存在通知容器
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end gap-2';
        document.body.appendChild(container);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `
        p-4 rounded-xl shadow-lg transform transition-all duration-300 ease-in-out
        ${type === 'success' ? 'bg-green-100 text-green-800' : ''}
        ${type === 'error' ? 'bg-red-100 text-red-800' : ''}
        ${type === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${type === 'info' ? 'bg-blue-100 text-blue-800' : ''}
        flex items-center gap-2 min-w-[240px] translate-x-0 opacity-100
    `;
    
    // 添加图标
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'w-5 h-5');
    iconSvg.setAttribute('viewBox', '0 0 20 20');
    iconSvg.setAttribute('fill', 'currentColor');
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    if (type === 'success') {
        iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z');
    } else if (type === 'error') {
        iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z');
    } else if (type === 'warning') {
        iconPath.setAttribute('d', 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z');
    } else {
        iconPath.setAttribute('d', 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z');
    }
    
    iconSvg.appendChild(iconPath);
    notification.appendChild(iconSvg);
    
    // 添加消息文本
    const messageText = document.createElement('span');
    messageText.textContent = message;
    notification.appendChild(messageText);
    
    // 添加到容器
    container.appendChild(notification);
    
    // 设置自动消失
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// 防抖函数
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
} 