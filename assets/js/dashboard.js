// 初始化Materialize组件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化模态框
    const modalElems = document.querySelectorAll('.modal');
    M.Modal.init(modalElems);
    
    // 加载仪表盘数据
    loadDashboardData();
    
    // 监听公告表单提交
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', handleAnnouncementSubmit);
    }
});

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 获取当前用户信息
        const user = await getCurrentUser();
        if (!user) return;
        
        // 获取用户详细资料
        const profile = await getUserProfile(user.id);
        if (profile) {
            // 设置欢迎信息
            document.getElementById('welcome-message').textContent = `欢迎回来，${profile.full_name}`;
            document.getElementById('last-login-time').textContent = formatDate(profile.last_login);
        }
        
        // 加载统计数据
        loadStatistics();
        
        // 加载最近任务
        loadRecentTasks();
        
        // 加载公告栏
        loadAnnouncements();
        
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        showToast('加载数据失败，请刷新页面重试', 'red');
    }
}

// 加载统计数据
async function loadStatistics() {
    try {
        // 获取今日日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISOString = today.toISOString();
        
        // 获取今日营业额
        const { data: revenueData, error: revenueError } = await supabase
            .from('orders')
            .select('amount')
            .gte('created_at', todayISOString);
            
        if (!revenueError && revenueData) {
            const totalRevenue = revenueData.reduce((sum, order) => sum + (order.amount || 0), 0);
            document.getElementById('today-revenue').textContent = `¥${totalRevenue.toFixed(2)}`;
        }
        
        // 获取今日顾客数
        const { data: customersData, error: customersError } = await supabase
            .from('orders')
            .select('customer_id')
            .gte('created_at', todayISOString);
            
        if (!customersError && customersData) {
            // 使用Set去重计算不同客户数量
            const uniqueCustomers = new Set(customersData.map(order => order.customer_id));
            document.getElementById('today-customers').textContent = uniqueCustomers.size;
        }
        
        // 获取待处理任务数
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id')
            .eq('status', 'pending');
            
        if (!tasksError && tasksData) {
            document.getElementById('pending-tasks').textContent = tasksData.length;
        }
        
        // 获取库存警报数
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('id')
            .lt('quantity', 'min_quantity');
            
        if (!inventoryError && inventoryData) {
            document.getElementById('inventory-alerts').textContent = inventoryData.length;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 加载最近任务
async function loadRecentTasks() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        // 获取分配给当前用户的最近5条待处理任务
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, title, priority, due_date')
            .eq('assignee_id', user.id)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(5);
            
        if (error) throw error;
        
        const tasksContainer = document.getElementById('recent-tasks');
        if (tasksContainer) {
            if (tasks && tasks.length > 0) {
                tasksContainer.innerHTML = tasks.map(task => `
                    <li class="collection-item">
                        <div class="task-item">
                            <span class="task-title">${task.title}</span>
                            <div>
                                <span class="task-priority priority-${task.priority}">${getPriorityText(task.priority)}</span>
                                <span class="grey-text text-darken-1 right">截止: ${formatDate(task.due_date).split(' ')[0]}</span>
                            </div>
                        </div>
                    </li>
                `).join('');
            } else {
                tasksContainer.innerHTML = '<li class="collection-item"><span>暂无待处理任务</span></li>';
            }
        }
    } catch (error) {
        console.error('加载最近任务失败:', error);
    }
}

// 获取优先级显示文本
function getPriorityText(priority) {
    switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'low': return '低';
        default: return '未知';
    }
}

// 加载公告栏
async function loadAnnouncements() {
    try {
        // 获取最近5条公告
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('id, title, content, created_at, created_by')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        const announcementsContainer = document.getElementById('announcements');
        if (announcementsContainer) {
            if (announcements && announcements.length > 0) {
                // 获取所有创建者的ID
                const creatorIds = [...new Set(announcements.map(a => a.created_by))];
                
                // 批量获取创建者信息
                const { data: creators, error: creatorsError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', creatorIds);
                    
                if (creatorsError) throw creatorsError;
                
                // 创建ID到名称的映射
                const creatorMap = {};
                if (creators) {
                    creators.forEach(creator => {
                        creatorMap[creator.id] = creator.full_name;
                    });
                }
                
                // 渲染公告列表
                announcementsContainer.innerHTML = announcements.map(announcement => `
                    <li class="collection-item">
                        <span class="title">${announcement.title}</span>
                        <p class="truncate">${announcement.content}</p>
                        <p class="grey-text">
                            <span>${creatorMap[announcement.created_by] || '未知用户'}</span> - 
                            <span>${formatDate(announcement.created_at)}</span>
                        </p>
                    </li>
                `).join('');
            } else {
                announcementsContainer.innerHTML = '<li class="collection-item"><span>暂无公告</span></li>';
            }
        }
    } catch (error) {
        console.error('加载公告失败:', error);
    }
}

// 处理公告提交
async function handleAnnouncementSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const title = document.getElementById('announcement-title').value;
    const content = document.getElementById('announcement-content').value;
    
    // 表单验证
    if (!title || !content) {
        showToast('请填写完整的公告信息', 'red');
        return;
    }
    
    try {
        // 获取当前用户信息
        const user = await getCurrentUser();
        if (!user) {
            showToast('请先登录', 'red');
            return;
        }
        
        // 创建前显示加载状态
        document.querySelector('button[type="submit"]').disabled = true;
        
        // 创建公告
        const { error } = await supabase
            .from('announcements')
            .insert({
                title: title,
                content: content,
                created_by: user.id,
                created_at: new Date().toISOString()
            });
            
        // 恢复按钮状态
        document.querySelector('button[type="submit"]').disabled = false;
        
        if (error) {
            showToast('发布公告失败: ' + error.message, 'red');
        } else {
            // 关闭模态框
            const modalInstance = M.Modal.getInstance(document.getElementById('add-announcement-modal'));
            modalInstance.close();
            
            // 清空表单
            document.getElementById('announcement-form').reset();
            
            // 显示成功消息
            showToast('公告发布成功', 'green');
            
            // 重新加载公告列表
            loadAnnouncements();
        }
    } catch (error) {
        document.querySelector('button[type="submit"]').disabled = false;
        showToast('发布公告失败，请重试', 'red');
        console.error('发布公告错误:', error);
    }
} 