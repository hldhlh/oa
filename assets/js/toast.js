/**
 * 简约黑白主题的通用信息提示组件
 */
class Toast {
    /**
     * 创建一个新的Toast实例
     * @param {Object} options - 配置选项
     * @param {string} options.message - 提示消息
     * @param {string} options.type - 提示类型 (success, error, info, warning)
     * @param {number} options.duration - 显示时长(毫秒)
     * @param {boolean} options.closable - 是否可关闭
     */
    constructor(options) {
        this.options = Object.assign({
            message: '',
            type: 'info',
            duration: 3000,
            closable: true
        }, options);
        
        this.init();
    }
    
    /**
     * 初始化Toast
     */
    init() {
        // 创建容器
        this.createContainer();
        
        // 创建Toast元素
        this.createElement();
        
        // 添加到容器
        this.container.appendChild(this.element);
        
        // 设置自动关闭
        if (this.options.duration > 0) {
            this.autoClose();
        }
    }
    
    /**
     * 创建Toast容器
     */
    createContainer() {
        let container = document.querySelector('.toast-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        this.container = container;
    }
    
    /**
     * 创建Toast元素
     */
    createElement() {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast ${this.options.type}`;
        
        // 创建内容
        const content = document.createElement('div');
        content.className = 'toast-content';
        content.textContent = this.options.message;
        toast.appendChild(content);
        
        // 创建关闭按钮
        if (this.options.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', () => this.close());
            toast.appendChild(closeBtn);
        }
        
        this.element = toast;
    }
    
    /**
     * 自动关闭
     */
    autoClose() {
        this.timer = setTimeout(() => {
            this.close();
        }, this.options.duration);
    }
    
    /**
     * 关闭Toast
     */
    close() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        this.element.classList.add('hide');
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            // 如果容器中没有Toast了，移除容器
            if (this.container && this.container.children.length === 0) {
                document.body.removeChild(this.container);
            }
        }, 300);
    }
    
    /**
     * 显示成功提示
     * @param {string} message - 提示消息
     * @param {Object} options - 其他选项
     * @returns {Toast} - Toast实例
     */
    static success(message, options = {}) {
        return new Toast({
            ...options,
            message,
            type: 'success'
        });
    }
    
    /**
     * 显示错误提示
     * @param {string} message - 提示消息
     * @param {Object} options - 其他选项
     * @returns {Toast} - Toast实例
     */
    static error(message, options = {}) {
        return new Toast({
            ...options,
            message,
            type: 'error'
        });
    }
    
    /**
     * 显示信息提示
     * @param {string} message - 提示消息
     * @param {Object} options - 其他选项
     * @returns {Toast} - Toast实例
     */
    static info(message, options = {}) {
        return new Toast({
            ...options,
            message,
            type: 'info'
        });
    }
    
    /**
     * 显示警告提示
     * @param {string} message - 提示消息
     * @param {Object} options - 其他选项
     * @returns {Toast} - Toast实例
     */
    static warning(message, options = {}) {
        return new Toast({
            ...options,
            message,
            type: 'warning'
        });
    }
}

// 导出Toast
window.Toast = Toast; 