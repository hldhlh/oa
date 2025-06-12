// 创建按钮
export function createButton({
    text,
    type = 'primary',
    size = 'medium',
    onClick,
    disabled = false,
    icon = null,
    fullWidth = false,
    className = ''
}) {
    const button = document.createElement('button');
    
    // 设置基本类
    let classes = 'rounded-xl font-medium transition-all focus:outline-none ';
    
    // 设置按钮类型
    switch (type) {
        case 'primary':
            classes += 'bg-primary text-white hover:bg-opacity-90 active:bg-opacity-100 ';
            break;
        case 'secondary':
            classes += 'bg-accent text-white hover:bg-opacity-90 active:bg-opacity-100 ';
            break;
        case 'outline':
            classes += 'border border-primary text-primary hover:bg-primary hover:text-white ';
            break;
        case 'ghost':
            classes += 'text-primary hover:bg-primary hover:bg-opacity-10 ';
            break;
        default:
            classes += 'bg-primary text-white hover:bg-opacity-90 active:bg-opacity-100 ';
    }
    
    // 设置按钮大小
    switch (size) {
        case 'small':
            classes += 'px-3 py-1 text-sm ';
            break;
        case 'medium':
            classes += 'px-4 py-2 ';
            break;
        case 'large':
            classes += 'px-6 py-3 text-lg ';
            break;
        default:
            classes += 'px-4 py-2 ';
    }
    
    // 设置宽度
    if (fullWidth) {
        classes += 'w-full ';
    }
    
    // 设置禁用状态
    if (disabled) {
        classes += 'opacity-50 cursor-not-allowed ';
    }
    
    // 添加自定义类
    classes += className;
    
    button.className = classes;
    button.disabled = disabled;
    
    // 设置内容
    if (icon) {
        button.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                ${icon}
                <span>${text}</span>
            </div>
        `;
    } else {
        button.textContent = text;
    }
    
    // 添加点击事件
    if (onClick && !disabled) {
        button.addEventListener('click', onClick);
    }
    
    return button;
}

// 创建输入框
export function createInput({
    type = 'text',
    placeholder = '',
    value = '',
    onChange,
    onBlur,
    onFocus,
    disabled = false,
    required = false,
    name = '',
    id = '',
    label = '',
    error = '',
    className = ''
}) {
    const container = document.createElement('div');
    container.className = 'mb-4';
    
    // 添加标签
    if (label) {
        const labelElement = document.createElement('label');
        labelElement.className = 'block text-gray-700 mb-2 font-medium';
        if (id) {
            labelElement.htmlFor = id;
        }
        labelElement.textContent = label;
        
        if (required) {
            const requiredMark = document.createElement('span');
            requiredMark.className = 'text-red-500 ml-1';
            requiredMark.textContent = '*';
            labelElement.appendChild(requiredMark);
        }
        
        container.appendChild(labelElement);
    }
    
    // 创建输入框
    const input = document.createElement('input');
    input.type = type;
    input.className = `w-full px-4 py-2 rounded-xl border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all ${className}`;
    input.placeholder = placeholder;
    input.value = value;
    input.disabled = disabled;
    
    if (name) input.name = name;
    if (id) input.id = id;
    if (required) input.required = true;
    
    // 添加事件监听
    if (onChange) input.addEventListener('input', onChange);
    if (onBlur) input.addEventListener('blur', onBlur);
    if (onFocus) input.addEventListener('focus', onFocus);
    
    container.appendChild(input);
    
    // 添加错误信息
    if (error) {
        const errorElement = document.createElement('p');
        errorElement.className = 'mt-1 text-red-500 text-sm';
        errorElement.textContent = error;
        container.appendChild(errorElement);
    }
    
    return container;
}

// 创建卡片
export function createCard({
    title = '',
    content = '',
    footer = '',
    className = '',
    onClick = null,
    hoverable = false
}) {
    const card = document.createElement('div');
    card.className = `bg-white rounded-2xl shadow-neumorphism p-6 ${hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''} ${className}`;
    
    if (onClick) {
        card.addEventListener('click', onClick);
        card.style.cursor = 'pointer';
    }
    
    // 添加标题
    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.className = 'text-xl font-bold mb-4 text-gray-800';
        titleElement.innerHTML = title;
        card.appendChild(titleElement);
    }
    
    // 添加内容
    if (content) {
        const contentElement = document.createElement('div');
        contentElement.className = 'mb-4';
        
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else {
            contentElement.appendChild(content);
        }
        
        card.appendChild(contentElement);
    }
    
    // 添加页脚
    if (footer) {
        const footerElement = document.createElement('div');
        footerElement.className = 'mt-4 pt-4 border-t border-gray-100';
        
        if (typeof footer === 'string') {
            footerElement.innerHTML = footer;
        } else {
            footerElement.appendChild(footer);
        }
        
        card.appendChild(footerElement);
    }
    
    return card;
}

// 创建标签
export function createBadge({
    text,
    type = 'default',
    size = 'medium'
}) {
    const badge = document.createElement('span');
    
    // 设置基本类
    let classes = 'inline-block rounded-full font-medium ';
    
    // 设置类型
    switch (type) {
        case 'primary':
            classes += 'bg-primary text-white ';
            break;
        case 'success':
            classes += 'bg-green-500 text-white ';
            break;
        case 'warning':
            classes += 'bg-yellow-500 text-white ';
            break;
        case 'danger':
            classes += 'bg-red-500 text-white ';
            break;
        case 'info':
            classes += 'bg-blue-500 text-white ';
            break;
        default:
            classes += 'bg-gray-200 text-gray-700 ';
    }
    
    // 设置大小
    switch (size) {
        case 'small':
            classes += 'px-2 py-0.5 text-xs ';
            break;
        case 'medium':
            classes += 'px-3 py-1 text-sm ';
            break;
        case 'large':
            classes += 'px-4 py-1.5 ';
            break;
        default:
            classes += 'px-3 py-1 text-sm ';
    }
    
    badge.className = classes;
    badge.textContent = text;
    
    return badge;
}

// 创建警告框
export function createAlert({
    title = '',
    message,
    type = 'info',
    dismissible = true,
    onDismiss = null
}) {
    const alert = document.createElement('div');
    
    // 设置基本类
    let classes = 'rounded-xl p-4 mb-4 flex items-start gap-3 ';
    
    // 设置类型
    switch (type) {
        case 'success':
            classes += 'bg-green-100 text-green-800 ';
            break;
        case 'warning':
            classes += 'bg-yellow-100 text-yellow-800 ';
            break;
        case 'error':
            classes += 'bg-red-100 text-red-800 ';
            break;
        case 'info':
        default:
            classes += 'bg-blue-100 text-blue-800 ';
    }
    
    alert.className = classes;
    
    // 创建图标
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'w-5 h-5 mt-0.5');
    iconSvg.setAttribute('viewBox', '0 0 20 20');
    iconSvg.setAttribute('fill', 'currentColor');
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    switch (type) {
        case 'success':
            iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z');
            break;
        case 'warning':
            iconPath.setAttribute('d', 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z');
            break;
        case 'error':
            iconPath.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z');
            break;
        case 'info':
        default:
            iconPath.setAttribute('d', 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z');
    }
    
    iconSvg.appendChild(iconPath);
    alert.appendChild(iconSvg);
    
    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-1';
    
    // 添加标题
    if (title) {
        const titleElement = document.createElement('h4');
        titleElement.className = 'font-bold mb-1';
        titleElement.textContent = title;
        contentDiv.appendChild(titleElement);
    }
    
    // 添加消息
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    contentDiv.appendChild(messageElement);
    
    alert.appendChild(contentDiv);
    
    // 添加关闭按钮
    if (dismissible) {
        const closeButton = document.createElement('button');
        closeButton.className = 'text-gray-500 hover:text-gray-700';
        closeButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        
        closeButton.addEventListener('click', () => {
            alert.remove();
            if (onDismiss) onDismiss();
        });
        
        alert.appendChild(closeButton);
    }
    
    return alert;
}

// 创建模态框
export function createModal({
    title = '',
    content = '',
    footer = '',
    size = 'medium',
    onClose = null,
    closeOnBackdrop = true
}) {
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
    
    // 创建模态框
    const modal = document.createElement('div');
    
    // 设置大小
    let sizeClass = '';
    switch (size) {
        case 'small':
            sizeClass = 'max-w-md';
            break;
        case 'medium':
            sizeClass = 'max-w-lg';
            break;
        case 'large':
            sizeClass = 'max-w-2xl';
            break;
        case 'xl':
            sizeClass = 'max-w-4xl';
            break;
        default:
            sizeClass = 'max-w-lg';
    }
    
    modal.className = `bg-white rounded-2xl shadow-lg w-full ${sizeClass} max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100`;
    
    // 创建模态框头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex items-center justify-between p-4 border-b border-gray-200';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'text-xl font-bold text-gray-800';
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700 focus:outline-none';
    closeButton.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    `;
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'p-4 overflow-y-auto flex-1';
    
    if (typeof content === 'string') {
        modalContent.innerHTML = content;
    } else {
        modalContent.appendChild(content);
    }
    
    // 创建模态框页脚
    let modalFooter = null;
    if (footer) {
        modalFooter = document.createElement('div');
        modalFooter.className = 'p-4 border-t border-gray-200 flex justify-end gap-2';
        
        if (typeof footer === 'string') {
            modalFooter.innerHTML = footer;
        } else {
            modalFooter.appendChild(footer);
        }
    }
    
    // 组装模态框
    modal.appendChild(modalHeader);
    modal.appendChild(modalContent);
    if (modalFooter) {
        modal.appendChild(modalFooter);
    }
    
    modalContainer.appendChild(modal);
    
    // 添加关闭事件
    closeButton.addEventListener('click', () => {
        closeModal();
    });
    
    if (closeOnBackdrop) {
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                closeModal();
            }
        });
    }
    
    // 关闭模态框函数
    function closeModal() {
        modal.classList.replace('scale-100', 'scale-95');
        modalContainer.classList.add('bg-opacity-0');
        
        setTimeout(() => {
            modalContainer.remove();
            if (onClose) onClose();
        }, 200);
    }
    
    // 显示模态框
    document.body.appendChild(modalContainer);
    
    // 添加动画效果
    setTimeout(() => {
        modal.classList.add('scale-100');
    }, 10);
    
    // 返回模态框对象
    return {
        element: modalContainer,
        close: closeModal
    };
}

// 创建表格
export function createTable({
    columns = [],
    data = [],
    striped = true,
    hoverable = true,
    bordered = false,
    compact = false,
    onRowClick = null
}) {
    const table = document.createElement('div');
    table.className = 'overflow-x-auto';
    
    const tableElement = document.createElement('table');
    tableElement.className = `min-w-full divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`;
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.className = `px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compact ? 'py-2' : ''}`;
        
        if (column.width) {
            th.style.width = column.width;
        }
        
        th.textContent = column.title;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    tableElement.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        
        if (striped && rowIndex % 2 === 1) {
            tr.className = 'bg-gray-50';
        }
        
        if (hoverable) {
            tr.className += ' hover:bg-gray-100 transition-colors';
        }
        
        if (onRowClick) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => onRowClick(row, rowIndex));
        }
        
        columns.forEach(column => {
            const td = document.createElement('td');
            td.className = `px-6 py-4 whitespace-nowrap ${compact ? 'py-2' : ''}`;
            
            if (column.render) {
                // 使用自定义渲染函数
                const content = column.render(row[column.dataIndex], row, rowIndex);
                
                if (typeof content === 'string') {
                    td.innerHTML = content;
                } else {
                    td.appendChild(content);
                }
            } else {
                // 默认渲染
                td.textContent = row[column.dataIndex] || '';
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    tableElement.appendChild(tbody);
    table.appendChild(tableElement);
    
    return table;
}