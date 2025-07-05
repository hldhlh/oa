// 1. Supabase 客户端初始化
const supabaseUrl = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
let currentUser; // 在脚本作用域内缓存用户对象

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Team management script loaded.');
    
    // 1. 获取当前用户并缓存
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (!currentUser) {
        alert('请先登录！');
        // 在实际应用中可能会重定向到主页或登录页
        return;
    }
    
    // 2. 加载并显示团队
    await loadUserTeams(currentUser);

    // 3. 绑定创建团队事件
    const createTeamBtn = document.getElementById('create-team-btn');
    createTeamBtn.addEventListener('click', handleCreateTeam);
});

async function loadUserTeams(user) {
    const container = document.getElementById('teams-list-container');
    container.innerHTML = '<p>正在加载您的团队信息...</p>';

    // 使用 Supabase RPC 调用一个数据库函数来获取复杂的嵌套数据
    // 这比在客户端进行多次查询更高效、更安全
    const { data: teams, error } = await supabase.rpc('get_user_teams_with_members');

    if (error) {
        console.error('获取团队信息失败:', error);
        container.innerHTML = `<p style="color: red;">无法加载团队信息: ${error.message}</p>`;
        return;
    }

    if (!teams || teams.length === 0) {
        container.innerHTML = '<p>您目前不属于任何团队。您可以创建一个新团队。</p>';
        return;
    }

    renderTeams(teams, user, container);
}

function renderTeams(teams, currentUser, container) {
    container.innerHTML = ''; // 清空加载提示
    teams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'card team-card';
        teamCard.dataset.teamId = team.id;

        const currentUserMembership = team.members.find(m => m.user_id === currentUser.id);
        const isManager = currentUserMembership && currentUserMembership.role === 'manager';

        teamCard.innerHTML = `
            <div class="team-header">
                <h2>${team.name}</h2>
                <div class="team-actions">
                    ${isManager ? `
                        <div class="form-inline">
                            <input type="email" class="add-member-input" placeholder="添加成员邮箱...">
                            <button class="add-member-btn">添加</button>
                        </div>
                        <button class="icon-btn delete-team-btn" title="删除团队">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <ul class="member-list">
                ${isManager ? team.members.map(member => `
                    <li class="member-item" data-user-id="${member.user_id}">
                        <div>
                            <span class="member-email">${member.email}</span>
                            <span class="member-role">${member.role}</span>
                        </div>
                        <div class="member-actions">
                            ${member.user_id !== currentUser.id ? `
                                <button class="update-role-btn text-btn" data-new-role="${member.role === 'manager' ? 'member' : 'manager'}">
                                    ${member.role === 'manager' ? '降为成员' : '提升为管理员'}
                                </button>
                                <button class="icon-btn remove-member-btn" title="移除成员">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            ` : '<span class="is-you-label">(You)</span>'}
                        </div>
                    </li>
                `).join('') : team.members.map(member => `
                     <li class="member-item" data-user-id="${member.user_id}">
                        <div>
                           <span class="member-email">${member.email}</span>
                            <span class="member-role">${member.role}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(teamCard);
    });

    bindTeamCardEvents(currentUser);
}

function bindTeamCardEvents(user) {
    document.querySelectorAll('.team-card').forEach(card => {
        const teamId = card.dataset.teamId;
        
        const addBtn = card.querySelector('.add-member-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => handleAddMember(teamId, user));
        }

        const deleteBtn = card.querySelector('.delete-team-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => handleDeleteTeam(teamId, user));
        }

        card.querySelectorAll('.member-item').forEach(item => {
            const memberId = item.dataset.userId;

            const updateRoleBtn = item.querySelector('.update-role-btn');
            if (updateRoleBtn) {
                const newRole = updateRoleBtn.dataset.newRole;
                updateRoleBtn.addEventListener('click', () => handleUpdateRole(teamId, memberId, newRole, user));
            }

            const removeBtn = item.querySelector('.remove-member-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => handleRemoveMember(teamId, memberId, user));
            }
        });
    });
}

async function handleAddMember(teamId, currentUser) {
    const input = document.querySelector(`.team-card[data-team-id="${teamId}"] .add-member-input`);
    const email = input.value.trim();
    if (!email) {
        alert('请输入成员邮箱。');
        return;
    }

    // 这是一个数据库函数，我们需要先创建它
    const { data: userData, error: userError } = await supabase.rpc('get_user_id_by_email', { user_email: email });

    if (userError || !userData) {
        console.error('查找用户失败:', userError);
        alert('找不到该邮箱对应的用户，请确认邮箱是否正确。');
        return;
    }
    
    // Use the new RPC function for adding a member
    const { error: insertError } = await supabase.rpc('add_team_member', {
        team_id: teamId,
        user_id: userData
    });

    if (insertError) {
        console.error('添加成员失败:', insertError);
        alert(`添加成员失败: ${insertError.message}`);
    } else {
        input.value = '';
        await loadUserTeams(currentUser);
    }
}

async function handleUpdateRole(teamId, memberId, newRole, currentUser) {
    // Use the new RPC function for updating a role
    const { error } = await supabase.rpc('update_team_member_role', {
        team_id: teamId,
        user_id: memberId,
        new_role: newRole
    });

    if (error) {
        alert(`更新角色失败: ${error.message}`);
    } else {
        await loadUserTeams(currentUser);
    }
}

async function handleRemoveMember(teamId, memberId, currentUser) {
    if (!confirm('确定要从团队中移除该成员吗？')) return;
    
    // Use the new RPC function for removing a member
    const { error } = await supabase.rpc('remove_team_member', {
        team_id: teamId,
        user_id: memberId
    });

    if (error) {
        alert(`移除成员失败: ${error.message}`);
    } else {
        await loadUserTeams(currentUser);
    }
}

async function handleDeleteTeam(teamId, currentUser) {
    if (!confirm('警告：您确定要永久删除这个团队吗？所有团队成员关系和相关数据都将被移除，此操作不可撤销！')) {
        return;
    }

    // Use the new RPC function for secure deletion
    const { error } = await supabase
        .rpc('delete_team', { team_id: teamId });

    if (error) {
        console.error('删除团队失败:', error);
        alert(`删除团队失败: ${error.message}`);
    } else {
        console.log(`团队 ${teamId} 已被删除`);
        await loadUserTeams(currentUser); // Refresh the list
    }
}

async function handleCreateTeam(event) {
    event.preventDefault();
    const teamNameInput = document.getElementById('new-team-name-input');
    const teamName = teamNameInput.value;

    if (!teamName) {
        alert('请输入团队名称');
        return;
    }

    try {
        // ** MODIFICATION: Changed from .from('teams').insert() to .rpc('create_team') **
        // The new RPC function handles creating the team and adding the manager in one go.
        const { data, error } = await supabase
            .rpc('create_team', { name: teamName });

        if (error) {
            console.error('创建团队失败:', error);
            throw error;
        }

        console.log('团队创建成功:', data);
        teamNameInput.value = '';
        await loadUserTeams(currentUser); // 使用缓存的用户对象刷新列表
    } catch (error) {
        // The error is already logged, but we can add more user-friendly feedback here
        alert('创建团队时发生错误，请查看控制台获取详情。');
    }
}