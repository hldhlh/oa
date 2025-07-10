// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 检查用户是否已登录
    const user = await checkUserSession();
    if (!user) {
        redirectToLogin();
        return;
    }
    
    // 初始化页面
    initTeamPage();
});

// 当前页码和每页数量
let currentPage = 1;
const pageSize = 10;
let totalTeams = 0;
let searchQuery = '';
let currentUser = null;

// 初始化团队页面
async function initTeamPage() {
    try {
        // 获取当前用户信息
        const supabase = window.supabase;
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        
        // 加载团队列表
        await loadTeams();
        
        // 设置事件监听器
        setupEventListeners();
    } catch (error) {
        console.error('初始化团队页面失败:', error);
    }
}

// 加载团队列表
async function loadTeams() {
    try {
        const supabase = window.supabase;
        
        // 使用RPC函数获取用户的团队
        const { data, error } = await supabase.rpc('get_user_teams_with_members');
        
        if (error) throw error;
        
        // 更新DOM
        updateTeamList(data || []);
        
        // 更新总数
        totalTeams = data?.length || 0;
        
        // 更新分页
        updatePagination();
    } catch (error) {
        console.error('加载团队列表失败:', error);
        document.getElementById('team-list').innerHTML = '<tr><td colspan="5">加载失败</td></tr>';
    }
}

// 更新团队列表
function updateTeamList(teams) {
    const teamListContainer = document.getElementById('team-list');
    
    if (teams.length === 0) {
        teamListContainer.innerHTML = '<tr><td colspan="5">暂无团队</td></tr>';
        return;
    }
    
    // 计算当前页的团队
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const currentPageTeams = teams.slice(start, end);
    
    teamListContainer.innerHTML = currentPageTeams.map(team => {
        // 计算成员数量
        const membersCount = team.members ? team.members.length : 0;
        
        return `
            <tr>
                <td>${team.id}</td>
                <td>${team.name}</td>
                <td>${membersCount}</td>
                <td>${formatDate(team.created_at)}</td>
                <td>
                    <button class="action-btn members" data-id="${team.id}" data-name="${team.name}" title="成员">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </button>
                    <button class="action-btn edit" data-id="${team.id}" title="编辑">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete" data-id="${team.id}" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // 添加事件监听器
    document.querySelectorAll('.action-btn.members').forEach(btn => {
        btn.addEventListener('click', () => showTeamMembers(btn.dataset.id, btn.dataset.name));
    });
    
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editTeam(btn.dataset.id));
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTeam(btn.dataset.id));
    });
}

// 更新分页
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(totalTeams / pageSize);
    
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
            loadTeams();
        });
    });
    
    // 添加上一页/下一页事件
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTeams();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTeams();
            }
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加团队按钮
    const addTeamBtn = document.getElementById('add-team-btn');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', showAddTeamModal);
    }
    
    // 搜索按钮
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-team');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadTeams();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                loadTeams();
            }
        });
    }
    
    // 团队模态框关闭按钮
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideTeamModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideTeamModal);
    }
    
    // 团队表单提交
    const teamForm = document.getElementById('team-form');
    if (teamForm) {
        teamForm.addEventListener('submit', handleTeamFormSubmit);
    }
    
    // 成员模态框关闭按钮
    const closeMembersModalBtn = document.getElementById('close-members-modal');
    if (closeMembersModalBtn) {
        closeMembersModalBtn.addEventListener('click', hideMembersModal);
    }
    
    // 添加成员按钮
    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', handleAddMember);
    }
}

// 显示添加团队模态框
function showAddTeamModal() {
    const modal = document.getElementById('team-modal');
    const modalTitle = document.getElementById('modal-title');
    const teamForm = document.getElementById('team-form');
    const teamIdInput = document.getElementById('team-id');
    
    // 重置表单
    teamForm.reset();
    teamIdInput.value = '';
    
    // 设置标题
    modalTitle.textContent = '添加团队';
    
    // 显示模态框
    modal.classList.add('show');
}

// 显示编辑团队模态框
async function editTeam(teamId) {
    try {
        const supabase = window.supabase;
        
        // 获取团队信息
        const { data, error } = await supabase.rpc('get_user_teams_with_members');
        
        if (error) throw error;
        
        // 找到指定ID的团队
        const team = data.find(t => t.id == teamId);
        
        if (!team) throw new Error('未找到团队');
        
        // 获取模态框元素
        const modal = document.getElementById('team-modal');
        const modalTitle = document.getElementById('modal-title');
        const teamIdInput = document.getElementById('team-id');
        const teamNameInput = document.getElementById('team-name');
        
        // 填充表单
        teamIdInput.value = team.id;
        teamNameInput.value = team.name;
        
        // 设置标题
        modalTitle.textContent = '编辑团队';
        
        // 显示模态框
        modal.classList.add('show');
    } catch (error) {
        console.error('获取团队信息失败:', error);
        alert('获取团队信息失败: ' + error.message);
    }
}

// 隐藏团队模态框
function hideTeamModal() {
    const modal = document.getElementById('team-modal');
    modal.classList.remove('show');
}

// 处理团队表单提交
async function handleTeamFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const teamId = document.getElementById('team-id').value;
    const teamName = document.getElementById('team-name').value;
    
    try {
        const supabase = window.supabase;
        
        // 使用RPC函数管理团队
        if (teamId) {
            // 更新团队
            const { data, error } = await supabase.rpc('manage_team', {
                action: 'update',
                payload: { id: parseInt(teamId), name: teamName }
            });
            
            if (error) throw error;
            
            alert('团队更新成功');
        } else {
            // 创建团队
            const { data, error } = await supabase.rpc('manage_team', {
                action: 'create',
                payload: { name: teamName }
            });
            
            if (error) throw error;
            
            alert('团队创建成功');
        }
        
        // 隐藏模态框
        hideTeamModal();
        
        // 重新加载团队列表
        loadTeams();
    } catch (error) {
        console.error('保存团队失败:', error);
        alert('保存团队失败: ' + error.message);
    }
}

// 删除团队
async function deleteTeam(teamId) {
    if (!confirm('确定要删除此团队吗？此操作不可撤销，将删除团队及其所有相关数据。')) {
        return;
    }
    
    try {
        const supabase = window.supabase;
        
        // 使用RPC函数删除团队
        const { data, error } = await supabase.rpc('manage_team', {
            action: 'delete',
            payload: { id: parseInt(teamId) }
        });
        
        if (error) throw error;
        
        alert('团队删除成功');
        
        // 重新加载团队列表
        loadTeams();
    } catch (error) {
        console.error('删除团队失败:', error);
        alert('删除团队失败: ' + error.message);
    }
}

// 显示团队成员模态框
async function showTeamMembers(teamId, teamName) {
    try {
        const supabase = window.supabase;
        
        // 获取团队信息
        const { data, error } = await supabase.rpc('get_user_teams_with_members');
        
        if (error) throw error;
        
        // 找到指定ID的团队
        const team = data.find(t => t.id == teamId);
        
        if (!team) throw new Error('未找到团队');
        
        // 获取模态框元素
        const modal = document.getElementById('members-modal');
        const modalTitle = document.getElementById('members-modal-title');
        const currentTeamIdInput = document.getElementById('current-team-id');
        
        // 设置标题和团队ID
        modalTitle.textContent = `${teamName} - 团队成员`;
        currentTeamIdInput.value = teamId;
        
        // 更新成员列表
        updateMemberList(team.members || []);
        
        // 显示模态框
        modal.classList.add('show');
    } catch (error) {
        console.error('获取团队成员失败:', error);
        alert('获取团队成员失败: ' + error.message);
    }
}

// 更新成员列表
function updateMemberList(members) {
    const memberListContainer = document.getElementById('member-list');
    
    if (members.length === 0) {
        memberListContainer.innerHTML = '<tr><td colspan="3">暂无成员</td></tr>';
        return;
    }
    
    memberListContainer.innerHTML = members.map(member => `
        <tr>
            <td>${member.full_name || member.id}</td>
            <td>
                <span class="member-role ${member.role}">
                    ${translateRole(member.role)}
                </span>
            </td>
            <td>
                ${member.role !== 'manager' ? `
                    <button class="action-btn delete" data-id="${member.id}" title="移除">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    // 添加移除成员事件监听器
    document.querySelectorAll('#member-list .action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => removeMember(btn.dataset.id));
    });
}

// 隐藏成员模态框
function hideMembersModal() {
    const modal = document.getElementById('members-modal');
    modal.classList.remove('show');
}

// 添加成员
async function handleAddMember() {
    const teamId = document.getElementById('current-team-id').value;
    const memberEmail = document.getElementById('member-email').value.trim();
    
    if (!memberEmail) {
        alert('请输入用户邮箱');
        return;
    }
    
    try {
        const supabase = window.supabase;
        
        // 先获取用户ID
        const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
            user_email: memberEmail
        });
        
        if (userError) throw userError;
        
        if (!userId) {
            alert('未找到该邮箱对应的用户');
            return;
        }
        
        // 添加成员
        const { error } = await supabase.rpc('add_team_member', {
            team_id: parseInt(teamId),
            user_id: userId
        });
        
        if (error) throw error;
        
        alert('成员添加成功');
        
        // 清空输入框
        document.getElementById('member-email').value = '';
        
        // 重新加载团队列表和成员列表
        const { data: teams } = await supabase.rpc('get_user_teams_with_members');
        const team = teams.find(t => t.id == teamId);
        
        if (team) {
            updateMemberList(team.members || []);
        }
        
        loadTeams();
    } catch (error) {
        console.error('添加成员失败:', error);
        alert('添加成员失败: ' + error.message);
    }
}

// 移除成员
async function removeMember(userId) {
    if (!confirm('确定要移除此成员吗？')) {
        return;
    }
    
    const teamId = document.getElementById('current-team-id').value;
    
    try {
        const supabase = window.supabase;
        
        // 移除成员
        const { error } = await supabase.rpc('remove_team_member', {
            team_id: parseInt(teamId),
            user_id: userId
        });
        
        if (error) throw error;
        
        alert('成员移除成功');
        
        // 重新加载团队列表和成员列表
        const { data: teams } = await supabase.rpc('get_user_teams_with_members');
        const team = teams.find(t => t.id == teamId);
        
        if (team) {
            updateMemberList(team.members || []);
        }
        
        loadTeams();
    } catch (error) {
        console.error('移除成员失败:', error);
        alert('移除成员失败: ' + error.message);
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
        'manager': '管理员',
        'member': '成员'
    };
    
    return roleMap[role] || role;
} 