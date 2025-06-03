// 工具函数库

// 显示/隐藏加载状态
function showLoading(show = true) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function hideLoading() {
    showLoading(false);
}

// 显示提示消息
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    // 设置消息内容
    toastMessage.textContent = message;
    
    // 清除之前的样式类
    toast.className = 'fixed top-4 right-4 px-4 py-3 rounded z-50';
    
    // 根据类型添加样式
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700');
            break;
        case 'error':
            toast.classList.add('bg-red-100', 'border', 'border-red-400', 'text-red-700');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-100', 'border', 'border-yellow-400', 'text-yellow-700');
            break;
        default:
            toast.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700');
    }
    
    // 显示提示
    toast.classList.remove('hidden');
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'YYYY-MM-DD HH:mm':
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        case 'YYYY-MM-DD HH:mm:ss':
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化货币
function formatCurrency(amount, currency = '¥') {
    return currency + Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 验证邮箱
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 验证手机号
function validatePhone(phone) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
}

// 生成随机ID
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 防抖函数
function debounce(func, wait) {
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
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 深拷贝
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// 加载HTML组件
async function loadComponent(containerId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
        }
    } catch (error) {
        console.error(`加载组件失败: ${componentPath}`, error);
    }
}

// 文件上传处理
function handleFileUpload(file, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB
            allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
            onProgress = null
        } = options;
        
        // 检查文件大小
        if (file.size > maxSize) {
            reject(new Error(`文件大小超过限制 (${formatFileSize(maxSize)})`));
            return;
        }
        
        // 检查文件类型
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            reject(new Error(`不支持的文件类型: ${fileExtension}`));
            return;
        }
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 模拟上传进度
        if (onProgress) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                onProgress(progress);
            }, 200);
        }
        
        // 这里应该调用实际的上传API
        setTimeout(() => {
            resolve({
                success: true,
                filename: file.name,
                size: file.size,
                url: URL.createObjectURL(file) // 临时URL，实际应该是服务器返回的URL
            });
        }, 1000);
    });
}

// 导出Excel
function exportToExcel(data, filename = 'export.xlsx') {
    // 这里需要引入xlsx库来实现Excel导出
    console.log('导出Excel功能需要xlsx库支持');
    showToast('Excel导出功能开发中...', 'info');
}

// 打印页面
function printPage(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>打印</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="p-4">
                        ${element.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    } else {
        window.print();
    }
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
    } catch (error) {
        console.error('复制失败:', error);
        showToast('复制失败', 'error');
    }
}

// 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 设置URL参数
function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// 本地存储操作
const LocalStorage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('本地存储设置失败:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('本地存储获取失败:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('本地存储删除失败:', error);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('本地存储清空失败:', error);
        }
    }
};

// 会话存储操作
const SessionStorage = {
    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('会话存储设置失败:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('会话存储获取失败:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error('会话存储删除失败:', error);
        }
    },
    
    clear() {
        try {
            sessionStorage.clear();
        } catch (error) {
            console.error('会话存储清空失败:', error);
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading, hideLoading, showToast, formatDate, formatFileSize, formatCurrency,
        validateEmail, validatePhone, generateId, debounce, throttle, deepClone,
        loadComponent, handleFileUpload, exportToExcel, printPage, copyToClipboard,
        getUrlParameter, setUrlParameter, LocalStorage, SessionStorage
    };
}
