// main.js - 主应用外壳逻辑

// 等待DOM和全局资源加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化Supabase客户端
    const supabase = window.OA.createClient();
    window.OA.supabase = supabase;

    // -------------------
    // UI 元素
    // -------------------
    const UI = {
        userProfileLink: document.getElementById('user-profile-link'),
        logoutButton: document.getElementById('logout-button'),
        navLinks: document.querySelectorAll('.nav-link'),
        contentFrame: document.getElementById('content-frame'),
        hamburgerBtn: document.getElementById('hamburger-btn'),
        navMenu: document.getElementById('nav-menu')
    };

    // -------------------
    // 核心功能
    // -------------------

    /**
     * 更新用户信息显示
     * @param {string} displayName - 要显示的用户名称
     */
    function updateUserInfoDisplay(displayName) {
        UI.userProfileLink.textContent = `欢迎, ${displayName}`;
    }

    /**
     * 处理用户登出
     */
    async function handleLogout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('登出失败:', error);
            window.OA.showMessage('登出失败，请稍后重试', 'error');
        } else {
            console.log('用户已登出，将重定向到登录页。');
            window.location.href = 'index.html';
        }
    }

    /**
     * 处理导航链接点击事件
     * @param {string} target - 目标页面URL
     * @param {HTMLElement} clickedLink - 被点击的链接元素
     */
    function handleNavigation(target, clickedLink = null) {
        console.log('导航到:', target);
        UI.contentFrame.src = target;
        
        // 更新导航链接的激活状态
        UI.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        if(clickedLink) {
            clickedLink.classList.add('active');
        }
        
        // 如果是移动端，点击后关闭菜单
        if (window.innerWidth <= 768) {
            UI.navMenu.classList.remove('active');
        }
    }

    /**
     * 切换移动端菜单的显示和隐藏
     */
    function toggleMobileMenu() {
        UI.hamburgerBtn.classList.toggle('active');
        UI.navMenu.classList.toggle('active');
    }

    // -------------------
    // 初始化和事件监听
    // -------------------
    
    // 将函数附加到window对象，以便iframe子页面可以调用
    window.updateUserInfoDisplay = updateUserInfoDisplay;

    // 检查用户会话
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        updateUserInfoDisplay(user.user_metadata?.full_name || user.email);
        console.log('用户已登录:', user.email);
    } else {
        console.log('用户未登录，将重定向到登录页。');
        window.location.href = '/';
    }
    
    // 登出逻辑
    UI.logoutButton.addEventListener('click', handleLogout);

    // 导航逻辑
    UI.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            handleNavigation(target, link);
        });
    });

    // 个人信息页面导航
    UI.userProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleNavigation('pages/profile/index.html');
    });
    
    // 菜单切换逻辑
    UI.hamburgerBtn.addEventListener('click', toggleMobileMenu);
    
    // ------------------------------------
    // 新增: iframe 与父窗口通信相关功能
    // ------------------------------------
    
    /**
     * 处理来自iframe的调度事件
     * @param {Object} data - iframe传递的事件数据
     */
    function handleIframeScheduleEvent(data) {
        console.log('主窗口处理iframe的调度事件:', data);
        
        const { type, targetId, clientX, clientY, resizeDirection } = data;
        
        // 获取iframe元素和位置
        const iframe = document.getElementById('content-frame');
        if (!iframe) return;
        
        const iframeRect = iframe.getBoundingClientRect();
        
        // 转换坐标，从iframe内部坐标转换为父窗口坐标
        const parentX = clientX + iframeRect.left;
        const parentY = clientY + iframeRect.top;
        
        // 根据事件类型创建并分发事件
        if (type === 'resize-start') {
            // 在父窗口中模拟resize-start事件
            simulateResizeStart(targetId, parentX, parentY, resizeDirection, iframe);
        } else if (type === 'drag-start') {
            // 在父窗口中模拟drag-start事件
            simulateDragStart(targetId, parentX, parentY, iframe);
        }
    }
    
    /**
     * 在父窗口中模拟resize-start事件
     */
    function simulateResizeStart(itemId, parentX, parentY, direction, iframe) {
        console.log(`模拟调整大小开始: 项目=${itemId}, 方向=${direction}, 坐标=(${parentX}, ${parentY})`);
        
        try {
            // 访问iframe内的元素
            const iframeScheduleItem = iframe.contentWindow.document.getElementById(itemId);
            if (!iframeScheduleItem) {
                console.error(`找不到iframe中的元素: ${itemId}`);
                return;
            }
            
            // 获取元素初始位置和尺寸信息
            const initialLeft = parseFloat(iframeScheduleItem.style.left) || 0;
            const initialWidth = iframeScheduleItem.offsetWidth;
            
            // 更新全局拖动状态
            window.dragStateHandler.setState({
                isResizing: true,
                isDragging: false,
                currentItem: null, // 父窗口中没有实际元素
                elementId: itemId,
                initialX: parentX,
                initialY: parentY,
                initialLeft: initialLeft,
                initialWidth: initialWidth,
                resizeDirection: direction,
                iframeElement: iframe
            });
            
            // 添加父窗口的鼠标事件监听器
            document.addEventListener('mousemove', handleParentMouseMove);
            document.addEventListener('mouseup', handleParentMouseUp);
            
            // 通知iframe元素已开始调整大小
            iframe.contentWindow.postMessage({
                type: 'parent-resize-update',
                data: {
                    itemId: itemId,
                    resizeClass: 'resizing'
                }
            }, '*');
            
        } catch (error) {
            console.error('模拟调整大小事件失败:', error);
        }
    }
    
    /**
     * 在父窗口中模拟drag-start事件
     */
    function simulateDragStart(itemId, parentX, parentY, iframe) {
        console.log(`模拟拖动开始: 项目=${itemId}, 坐标=(${parentX}, ${parentY})`);
        
        try {
            // 访问iframe内的元素
            const iframeScheduleItem = iframe.contentWindow.document.getElementById(itemId);
            if (!iframeScheduleItem) {
                console.error(`找不到iframe中的元素: ${itemId}`);
                return;
            }
            
            // 获取元素初始位置信息
            const initialLeft = parseFloat(iframeScheduleItem.style.left) || 0;
            const initialWidth = iframeScheduleItem.offsetWidth;
            
            // 更新全局拖动状态
            window.dragStateHandler.setState({
                isDragging: true,
                isResizing: false,
                currentItem: null, // 父窗口中没有实际元素
                elementId: itemId,
                initialX: parentX,
                initialY: parentY,
                initialLeft: initialLeft,
                initialWidth: initialWidth,
                iframeElement: iframe
            });
            
            // 添加父窗口的鼠标事件监听器
            document.addEventListener('mousemove', handleParentMouseMove);
            document.addEventListener('mouseup', handleParentMouseUp);
            
            // 通知iframe元素已开始拖动
            iframe.contentWindow.postMessage({
                type: 'parent-drag-update',
                data: {
                    itemId: itemId,
                    dragClass: 'dragging'
                }
            }, '*');
            
        } catch (error) {
            console.error('模拟拖动事件失败:', error);
        }
    }
    
    /**
     * 处理父窗口中的鼠标移动事件
     */
    function handleParentMouseMove(e) {
        const dragState = window.dragStateHandler.getState();
        if (!dragState.isDragging && !dragState.isResizing) return;
        
        e.preventDefault(); // 防止选择文本
        
        const iframe = dragState.iframeElement;
        if (!iframe) return;
        
        const deltaX = e.clientX - dragState.initialX;
        
        try {
            if (dragState.isResizing) {
                // 调整大小逻辑
                if (dragState.resizeDirection === 'right') {
                    // 调整右侧（结束时间）
                    const newWidth = Math.max(50, dragState.initialWidth + deltaX);
                    
                    // 通知iframe更新元素大小
                    iframe.contentWindow.postMessage({
                        type: 'parent-resize-update',
                        data: {
                            itemId: dragState.elementId,
                            newWidth: newWidth
                        }
                    }, '*');
                } else if (dragState.resizeDirection === 'left') {
                    // 调整左侧（开始时间）
                    const newLeft = Math.min(dragState.initialLeft + deltaX,
                                    dragState.initialLeft + dragState.initialWidth - 50);
                    const newWidth = dragState.initialLeft + dragState.initialWidth - newLeft;
                    
                    // 通知iframe更新元素位置和大小
                    iframe.contentWindow.postMessage({
                        type: 'parent-resize-update',
                        data: {
                            itemId: dragState.elementId,
                            newLeft: newLeft,
                            newWidth: newWidth
                        }
                    }, '*');
                }
            } else if (dragState.isDragging) {
                // 拖动逻辑
                const newLeft = Math.max(0, dragState.initialLeft + deltaX);
                
                // 通知iframe更新元素位置
                iframe.contentWindow.postMessage({
                    type: 'parent-drag-update',
                    data: {
                        itemId: dragState.elementId,
                        newLeft: newLeft
                    }
                }, '*');
            }
        } catch (error) {
            console.error('处理父窗口鼠标移动事件失败:', error);
        }
    }
    
    /**
     * 处理父窗口中的鼠标松开事件
     */
    function handleParentMouseUp(e) {
        const dragState = window.dragStateHandler.getState();
        if (!dragState.isDragging && !dragState.isResizing) return;
        
        const iframe = dragState.iframeElement;
        if (!iframe) return;
        
        const deltaX = e.clientX - dragState.initialX;
        
        // 计算最终位置和大小
        let finalData = {};
        
        try {
            if (dragState.isResizing) {
                if (dragState.resizeDirection === 'right') {
                    finalData.finalWidth = Math.max(50, dragState.initialWidth + deltaX);
                } else if (dragState.resizeDirection === 'left') {
                    const newLeft = Math.min(dragState.initialLeft + deltaX,
                                    dragState.initialLeft + dragState.initialWidth - 50);
                    finalData.finalLeft = newLeft;
                    finalData.finalWidth = dragState.initialLeft + dragState.initialWidth - newLeft;
                }
            } else if (dragState.isDragging) {
                finalData.finalLeft = Math.max(0, dragState.initialLeft + deltaX);
            }
            
            // 通知iframe拖动或调整大小结束
            iframe.contentWindow.postMessage({
                type: dragState.isResizing ? 'parent-resize-end' : 'parent-drag-end',
                data: {
                    itemId: dragState.elementId,
                    ...finalData,
                    saveChanges: true
                }
            }, '*');
        } catch (error) {
            console.error('处理父窗口鼠标松开事件失败:', error);
        } finally {
            // 移除父窗口的事件监听器
            document.removeEventListener('mousemove', handleParentMouseMove);
            document.removeEventListener('mouseup', handleParentMouseUp);
            
            // 重置拖动状态
            window.dragStateHandler.resetState();
        }
    }
    
    // 暴露处理函数到全局，以便main.html中的脚本可以调用
    window.handleIframeScheduleEvent = handleIframeScheduleEvent;
    window.simulateResizeStart = simulateResizeStart;
    window.simulateDragStart = simulateDragStart;
    window.handleParentMouseMove = handleParentMouseMove;
    window.handleParentMouseUp = handleParentMouseUp;
}); 