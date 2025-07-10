// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 检查用户是否已登录
    const user = await checkUserSession();
    if (!user) {
        redirectToLogin();
        return;
    }
    
    // 初始化页面
    initTaskPage();
});

// 当前页码和每页数量
let currentPage = 1;
const pageSize = 10;
let totalTasks = 0;
let searchQuery = '';
let currentUser = null;
let userTeams = [];

// 初始化任务页面
async function initTaskPage() {
    try {
        // 获取当前用户信息
        const supabase = window.supabase;
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        
        // 获取用户所在的团队
        await loadUserTeams();
        
        // 加载任务列表
        await loadTasks();
        
        // 设置事件监听器
        setupEventListeners();
    } catch (error) {
        console.error('初始化任务页面失败:', error);
    }
}

// 加载用户所在的团队
async function loadUserTeams() {
    try {
        const supabase = window.supabase;
        
        // 使用RPC函数获取用户的团队
        const { data, error } = await supabase.rpc('get_user_teams_with_members');
        
        if (error) throw error;
        
        userTeams = data || [];
        
        // 更新团队下拉菜单
        updateTeamDropdown(userTeams);
    } catch (error) {
        console.error('加载用户团队失败:', error);
        userTeams = [];
    }
}

// 更新团队下拉菜单
function updateTeamDropdown(teams) {
    const teamSelect = document.getElementById('team-filter');
    if (!teamSelect) return;
    
    // 添加"全部团队"选项
    let options = '<option value="">全部团队</option>';
    
    // 添加团队选项
    teams.forEach(team => {
        options += `<option value="${team.id}">${team.name}</option>`;
    });
    
    teamSelect.innerHTML = options;
    
    // 添加团队筛选事件
    teamSelect.addEventListener('change', () => {
        currentPage = 1;
        loadTasks();
    });
}

// 加载任务列表
async function loadTasks() {
    try {
        const supabase = window.supabase;
        
        // 获取筛选条件
        const teamFilter = document.getElementById('team-filter')?.value;
        const statusFilter = document.getElementById('status-filter')?.value;
        
        // 构建查询
        let query = supabase
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
            `, { count: 'exact' });
        
        // 添加团队筛选
        if (teamFilter) {
            query = query.eq('team_id', teamFilter);
        }
        
        // 添加状态筛选
        if (statusFilter) {
            const now = new Date().toISOString();
            
            switch (statusFilter) {
                case 'pending':
                    query = query.gt('start_time', now);
                    break;
                case 'in_progress':
                    query = query.lte('start_time', now).gte('end_time', now);
                    break;
                case 'completed':
                    query = query.lt('end_time', now);
                    break;
            }
        }
        
        // 添加搜索条件
        if (searchQuery) {
            query = query.ilike('task_description', `%${searchQuery}%`);
        }
        
        // 添加分页
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // 执行查询
        const { data: tasks, count, error } = await query
            .order('start_time', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        
        // 更新总数
        totalTasks = count || 0;
        
        // 更新DOM
        updateTaskList(tasks || []);
        
        // 更新分页
        updatePagination();
    } catch (error) {
        console.error('加载任务列表失败:', error);
        document.getElementById('task-list').innerHTML = '<tr><td colspan="6">加载失败</td></tr>';
    }
}

// 更新任务列表
function updateTaskList(tasks) {
    const taskListContainer = document.getElementById('task-list');
    
    if (tasks.length === 0) {
        taskListContainer.innerHTML = '<tr><td colspan="6">暂无任务</td></tr>';
        return;
    }
    
    taskListContainer.innerHTML = tasks.map(task => `
        <tr>
            <td>${task.task_description || '无描述'}</td>
            <td>${task.teams ? task.teams.name : '未分配'}</td>
            <td>${formatDate(task.start_time)}</td>
            <td>${formatDate(task.end_time)}</td>
            <td><span class="status status-${getTaskStatus(task.start_time, task.end_time)}">${translateStatus(getTaskStatus(task.start_time, task.end_time))}</span></td>
            <td>
                <button class="action-btn edit" data-id="${task.id}" title="编辑">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" data-id="${task.id}" title="删除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // 添加编辑和删除事件监听器
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editTask(btn.dataset.id));
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
}

// 更新分页
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(totalTasks / pageSize);
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} id="prev-page">上一页</button>`;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<button disabled>...</button>`;
        }
    }
    
    // 下一页按钮
    paginationHTML += `<button ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} id="next-page">下一页</button>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // 添加页码点击事件
    document.querySelectorAll('#pagination button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            loadTasks();
        });
    });
    
    // 添加上一页/下一页事件
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTasks();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTasks();
            }
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务按钮
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', showAddTaskModal);
    }
    
    // 搜索按钮
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-task');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadTasks();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                loadTasks();
            }
        });
    }
    
    // 状态筛选
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            loadTasks();
        });
    }
    
    // 模态框关闭按钮
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideTaskModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideTaskModal);
    }
    
    // 任务表单提交
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
}

// 显示添加任务模态框
function showAddTaskModal() {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskForm = document.getElementById('task-form');
    const taskIdInput = document.getElementById('task-id');
    const teamSelect = document.getElementById('team-id');
    
    // 重置表单
    taskForm.reset();
    taskIdInput.value = '';
    
    // 设置标题
    modalTitle.textContent = '添加任务';
    
    // 填充团队下拉菜单
    if (teamSelect) {
        teamSelect.innerHTML = userTeams.map(team => 
            `<option value="${team.id}">${team.name}</option>`
        ).join('');
    }
    
    // 显示模态框
    modal.classList.add('show');
}

// 显示编辑任务模态框
async function editTask(taskId) {
    try {
        const supabase = window.supabase;
        
        // 获取任务信息
        const { data: task, error } = await supabase
            .from('schedules')
            .select(`
                id,
                task_description,
                start_time,
                end_time,
                user_id,
                team_id
            `)
            .eq('id', taskId)
            .single();
        
        if (error) throw error;
        
        // 获取模态框元素
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const taskIdInput = document.getElementById('task-id');
        const taskDescInput = document.getElementById('task-description');
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');
        const teamSelect = document.getElementById('team-id');
        
        // 填充表单
        taskIdInput.value = task.id;
        taskDescInput.value = task.task_description || '';
        
        // 格式化日期时间为本地时间格式 (YYYY-MM-DDThh:mm)
        startTimeInput.value = formatDateTimeForInput(task.start_time);
        endTimeInput.value = formatDateTimeForInput(task.end_time);
        
        // 填充团队下拉菜单
        if (teamSelect) {
            teamSelect.innerHTML = userTeams.map(team => 
                `<option value="${team.id}" ${team.id === task.team_id ? 'selected' : ''}>${team.name}</option>`
            ).join('');
        }
        
        // 设置标题
        modalTitle.textContent = '编辑任务';
        
        // 显示模态框
        modal.classList.add('show');
    } catch (error) {
        console.error('获取任务信息失败:', error);
        alert('获取任务信息失败: ' + error.message);
    }
}

// 隐藏任务模态框
function hideTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('show');
}

// 处理任务表单提交
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const taskId = document.getElementById('task-id').value;
    const taskDesc = document.getElementById('task-description').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const teamId = document.getElementById('team-id').value;
    
    // 验证日期
    if (new Date(startTime) >= new Date(endTime)) {
        alert('开始时间必须早于结束时间');
        return;
    }
    
    try {
        const supabase = window.supabase;
        
        if (taskId) {
            // 使用RPC函数更新任务
            const { data, error } = await supabase.rpc('update_schedule_time_safely', {
                schedule_id: parseInt(taskId),
                new_start_time: new Date(startTime).toISOString(),
                new_end_time: new Date(endTime).toISOString()
            });
            
            if (error) throw error;
            
            // 更新任务描述和团队
            const { error: updateError } = await supabase
                .from('schedules')
                .update({
                    task_description: taskDesc,
                    team_id: teamId ? parseInt(teamId) : null
                })
                .eq('id', taskId);
            
            if (updateError) throw updateError;
            
            alert('任务更新成功');
        } else {
            // 添加任务
            const { error } = await supabase
                .from('schedules')
                .insert({
                    task_description: taskDesc,
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date(endTime).toISOString(),
                    team_id: teamId ? parseInt(teamId) : null,
                    user_id: currentUser.id,
                    version: 1
                });
            
            if (error) throw error;
            
            alert('任务添加成功');
        }
        
        // 隐藏模态框
        hideTaskModal();
        
        // 重新加载任务列表
        loadTasks();
    } catch (error) {
        console.error('保存任务失败:', error);
        alert('保存任务失败: ' + error.message);
    }
}

// 删除任务
async function deleteTask(taskId) {
    if (!confirm('确定要删除此任务吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        const supabase = window.supabase;
        
        // 使用RPC函数安全删除任务
        const { data, error } = await supabase.rpc('delete_schedule_safely', {
            schedule_id: parseInt(taskId)
        });
        
        if (error) throw error;
        
        alert('任务删除成功');
        
        // 重新加载任务列表
        loadTasks();
    } catch (error) {
        console.error('删除任务失败:', error);
        alert('删除任务失败: ' + error.message);
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

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '无日期';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化日期时间为输入框格式 (YYYY-MM-DDThh:mm)
function formatDateTimeForInput(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // 格式化为YYYY-MM-DDThh:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 翻译状态
function translateStatus(status) {
    const statusMap = {
        'pending': '待处理',
        'in_progress': '进行中',
        'completed': '已完成'
    };
    
    return statusMap[status] || status;
}
