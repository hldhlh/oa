// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 检查用户是否已登录
    const user = await checkUserSession();
    if (!user) {
        redirectToLogin();
        return;
    }
    
    // 初始化页面
    initUserPage();
});

// 当前页码和每页数量
let currentPage = 1;
const pageSize = 10;
let totalUsers = 0;
let searchQuery = '';

// 初始化用户页面
async function initUserPage() {
    // 加载用户列表
    await loadUsers();
    
    // 设置事件监听器
    setupEventListeners();
}

// 加载用户列表
async function loadUsers() {
    try {
        const supabase = window.supabase;
        
        // 构建查询 (使用profiles表)
        let query = supabase
            .from('profiles')
            .select('id, full_name, updated_at', { count: 'exact' });
        
        // 添加搜索条件
        if (searchQuery) {
            query = query.or(`full_name.ilike.%${searchQuery}%`);
        }
        
        // 添加分页
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // 执行查询
        const { data: users, count, error } = await query
            .order('updated_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        
        // 更新总数
        totalUsers = count || 0;
        
        // 更新DOM
        updateUserList(users || []);
        
        // 更新分页
        updatePagination();
    } catch (error) {
        console.error('加载用户列表失败:', error);
        document.getElementById('user-list').innerHTML = '<tr><td colspan="6">加载失败</td></tr>';
    }
}

// 更新用户列表
function updateUserList(users) {
    const userListContainer = document.getElementById('user-list');
    
    if (users.length === 0) {
        userListContainer.innerHTML = '<tr><td colspan="6">暂无用户</td></tr>';
        return;
    }
    
    userListContainer.innerHTML = users.map(user => `
        <tr>
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.full_name || '未命名用户'}</td>
            <td>${user.id}</td>
            <td>${getUserRole(user)}</td>
            <td>${formatDate(user.updated_at)}</td>
            <td>
                <button class="action-btn edit" data-id="${user.id}" title="编辑">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" data-id="${user.id}" title="删除">
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
        btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });
}

// 获取用户角色 (简化处理，实际应该从team_members表查询)
function getUserRole(user) {
    // 这里简化处理，实际应该根据team_members表中的role字段确定
    return '普通用户';
}

// 更新分页
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(totalUsers / pageSize);
    
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
            loadUsers();
        });
    });
    
    // 添加上一页/下一页事件
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsers();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadUsers();
            }
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加用户按钮
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    // 搜索按钮
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-user');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadUsers();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                loadUsers();
            }
        });
    }
    
    // 模态框关闭按钮
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideUserModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideUserModal);
    }
    
    // 用户表单提交
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }
}

// 显示添加用户模态框
function showAddUserModal() {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('modal-title');
    const userForm = document.getElementById('user-form');
    const userIdInput = document.getElementById('user-id');
    
    // 重置表单
    userForm.reset();
    userIdInput.value = '';
    
    // 设置标题
    modalTitle.textContent = '添加用户';
    
    // 显示模态框
    modal.classList.add('show');
}

// 显示编辑用户模态框
async function editUser(userId) {
    try {
        const supabase = window.supabase;
        
        // 获取用户信息
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        // 获取模态框元素
        const modal = document.getElementById('user-modal');
        const modalTitle = document.getElementById('modal-title');
        const userIdInput = document.getElementById('user-id');
        const fullNameInput = document.getElementById('full-name');
        const emailInput = document.getElementById('email');
        const roleInput = document.getElementById('role');
        
        // 填充表单
        userIdInput.value = user.id;
        fullNameInput.value = user.full_name || '';
        emailInput.value = user.id; // 使用ID代替邮箱
        roleInput.value = 'user'; // 默认角色
        
        // 设置标题
        modalTitle.textContent = '编辑用户';
        
        // 显示模态框
        modal.classList.add('show');
    } catch (error) {
        console.error('获取用户信息失败:', error);
        alert('获取用户信息失败: ' + error.message);
    }
}

// 隐藏用户模态框
function hideUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.remove('show');
}

// 处理用户表单提交
async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const userId = document.getElementById('user-id').value;
    const fullName = document.getElementById('full-name').value;
    
    try {
        const supabase = window.supabase;
        
        if (userId) {
            // 更新用户
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (error) throw error;
            
            alert('用户更新成功');
        } else {
            // 添加用户 - 实际应该使用Supabase Auth API
            alert('添加用户功能需要使用Supabase Auth API，请联系管理员');
            return;
        }
        
        // 隐藏模态框
        hideUserModal();
        
        // 重新加载用户列表
        loadUsers();
    } catch (error) {
        console.error('保存用户失败:', error);
        alert('保存用户失败: ' + error.message);
    }
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除此用户吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        alert('删除用户需要管理员权限，请联系系统管理员');
        return;
        
        // 实际删除用户的代码 - 需要管理员权限
        /*
        const supabase = window.supabase;
        
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        alert('用户删除成功');
        
        // 重新加载用户列表
        loadUsers();
        */
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除用户失败: ' + error.message);
    }
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 翻译角色
function translateRole(role) {
    const roleMap = {
        'admin': '管理员',
        'user': '普通用户',
        'manager': '团队管理员',
        'member': '团队成员'
    };
    
    return roleMap[role] || role;
}
