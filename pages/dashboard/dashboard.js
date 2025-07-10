// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 检查用户是否已登录
    const user = await checkUserSession();
    if (!user) {
        redirectToLogin();
        return;
    }
    
    // 加载仪表盘数据
    await loadDashboardData();
});

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 获取统计数据
        await loadStats();
        
        // 获取最近任务
        await loadRecentTasks();
        
        // 获取最新用户
        await loadRecentUsers();
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}

// 加载统计数据
async function loadStats() {
    try {
        const supabase = window.supabase;
        
        // 获取用户总数 (从profiles表获取)
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (userError) throw userError;
        
        // 获取任务总数 (使用schedules表)
        const { count: taskCount, error: taskError } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true });
        
        if (taskError) throw taskError;
        
        // 获取团队总数
        const { count: teamCount, error: teamError } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });
        
        if (teamError) throw teamError;
        
        // 更新DOM
        document.getElementById('total-users').textContent = userCount || 0;
        document.getElementById('total-tasks').textContent = taskCount || 0;
        document.getElementById('completed-tasks').textContent = teamCount || 0; // 使用团队数替代已完成任务数
    } catch (error) {
        console.error('加载统计数据失败:', error);
        // 设置默认值
        document.getElementById('total-users').textContent = '0';
        document.getElementById('total-tasks').textContent = '0';
        document.getElementById('completed-tasks').textContent = '0';
    }
}

// 加载最近任务
async function loadRecentTasks() {
    try {
        const supabase = window.supabase;
        
        // 获取最近5个任务 (使用schedules表)
        const { data: tasks, error } = await supabase
            .from('schedules')
            .select(`
                id,
                task_description,
                start_time,
                end_time,
                user_id,
                team_id,
                teams (
                    name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        // 更新DOM
        const tasksContainer = document.getElementById('recent-tasks');
        
        if (tasks && tasks.length > 0) {
            tasksContainer.innerHTML = tasks.map(task => {
                const status = getTaskStatus(task.start_time, task.end_time);
                return `
                    <tr>
                        <td>${task.task_description || '无描述'}</td>
                        <td>${task.teams ? task.teams.name : '未分配'}</td>
                        <td>${formatDate(task.end_time)}</td>
                        <td><span class="status status-${status}">${getStatusText(status)}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            tasksContainer.innerHTML = '<tr><td colspan="4">暂无任务</td></tr>';
        }
    } catch (error) {
        console.error('加载最近任务失败:', error);
        document.getElementById('recent-tasks').innerHTML = '<tr><td colspan="4">加载失败</td></tr>';
    }
}

// 加载最新用户
async function loadRecentUsers() {
    try {
        const supabase = window.supabase;
        
        // 获取最新5个用户 (从profiles表获取)
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, full_name, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        // 更新DOM
        const usersContainer = document.getElementById('recent-users');
        
        if (users && users.length > 0) {
            usersContainer.innerHTML = users.map(user => `
                <li>
                    <div class="user-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="user-info">
                        <p class="user-name">${user.full_name || '未命名用户'}</p>
                        <p class="user-email">${user.id}</p>
                    </div>
                </li>
            `).join('');
        } else {
            usersContainer.innerHTML = '<li>暂无用户</li>';
        }
    } catch (error) {
        console.error('加载最新用户失败:', error);
        document.getElementById('recent-users').innerHTML = '<li>加载失败</li>';
    }
}

// 根据开始时间和结束时间确定任务状态
function getTaskStatus(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
        return 'pending';
    } else if (now >= start && now <= end) {
        return 'in_progress';
    } else {
        return 'completed';
    }
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待处理',
        'in_progress': '进行中',
        'completed': '已完成'
    };
    
    return statusMap[status] || status;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '无截止日期';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
