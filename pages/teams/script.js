// 1. Supabase 客户端初始化
const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error('用户未登录或会话已过期', error);
        // 在实际应用中，可能会重定向到登录页
        // window.location.href = '/'; 
        return;
    }
    currentUser = user;
    
    await loadUserTeams();

    document.getElementById('create-team-btn').addEventListener('click', handleCreateTeam);
    document.getElementById('teams-list-container').addEventListener('click', handleCardActions);
});

async function loadUserTeams() {
    const container = document.getElementById('teams-list-container');
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const { data: teams, error } = await supabase.rpc('get_user_teams_with_members');
        if (error) throw error;
        displayTeamCards(teams);
    } catch (error) {
        console.error('获取团队信息失败:', error);
        container.innerHTML = `<p class="empty-state">加载团队失败: ${error.message}</p>`;
    }
}

function displayTeamCards(teams) {
    const container = document.getElementById('teams-list-container');
    
    if (!teams || teams.length === 0) {
        container.innerHTML = '<p class="empty-state">您尚未加入任何团队。</p>';
        return;
    }

    container.innerHTML = '';
    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.teamId = team.id;

        const currentUserMembership = team.members.find(m => m.user_id === currentUser.id);
        const isManager = currentUserMembership && currentUserMembership.role && currentUserMembership.role.toLowerCase() === 'manager';
        
        // --- 新增: 根据角色显示/隐藏创建团队的表单 ---
        const createTeamForm = document.querySelector('.card');
        if (isManager) {
            createTeamForm.style.display = 'block';
        } else {
            createTeamForm.style.display = 'none';
        }
        // ------------------------------------------

        // 1. Header
        const teamHeader = document.createElement('div');
        teamHeader.className = 'team-header';
        const teamName = document.createElement('h2');
        teamName.textContent = team.name;
        const teamActions = document.createElement('div');
        teamActions.className = 'team-actions';

        if (isManager) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'team-delete-button-critical';
            deleteBtn.title = '删除团队';
            deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
            teamActions.appendChild(deleteBtn);
        }
        teamHeader.appendChild(teamName);
        teamHeader.appendChild(teamActions);
        card.appendChild(teamHeader);

        // 2. Member List
        const memberList = document.createElement('ul');
        memberList.className = 'member-list';
        team.members.forEach(member => {
            const memberItem = document.createElement('li');
            memberItem.className = 'member-item';
            memberItem.dataset.userId = member.user_id;
            
            let actionsHtml = '';
            if (isManager && currentUser.id !== member.user_id) {
                const newRole = member.role.toLowerCase() === 'manager' ? 'member' : 'manager';
                const buttonText = member.role.toLowerCase() === 'manager' ? '降为成员' : '提升为管理员';
                actionsHtml = `<button class="text-btn update-role-btn" data-new-role="${newRole}">${buttonText}</button>
                               <button class="icon-btn remove-member-btn" title="移除成员">&times;</button>`;
            } else if (currentUser.id === member.user_id) {
                actionsHtml = '<span class="is-you-label">这是您</span>';
            }

            memberItem.innerHTML = `<div>
                                      <span class="member-email">${member.full_name || member.email}</span>
                                      <span class="member-role">${member.role}</span>
                                  </div>
                                  <div class="member-actions">${actionsHtml}</div>`;
            memberList.appendChild(memberItem);
        });
        card.appendChild(memberList);

        // 3. Invite Section
        if (isManager) {
            const inviteSection = document.createElement('div');
            inviteSection.id = 'invite-section';
            inviteSection.innerHTML = `<form class="form-inline add-member-form">
                                          <input type="email" class="new-member-email" placeholder="输入新成员的邮箱..." required>
                                          <button type="submit">添加成员</button>
                                       </form>`;
            card.appendChild(inviteSection);
        }
        
        container.appendChild(card);
    });
}

async function handleCreateTeam() {
    const teamNameInput = document.getElementById('new-team-name');
    const teamName = teamNameInput.value.trim();
    if (!teamName) return showMesg('请输入团队名称。');

    try {
        // 使用新的 manage_team RPC 函数创建团队
        const { data: result, error } = await supabase.rpc('manage_team', {
            action: 'CREATE_TEAM',
            payload: { name: teamName }
        });

        if (error) throw error;
        
        showMesg('团队创建成功！');
        teamNameInput.value = '';
        await loadUserTeams();
    } catch (error) {
        console.error('创建团队失败:', error);
        showMesg(`创建失败: ${error.message}`);
    }
}

/**
 * Shows a custom confirmation modal.
 * @param {string} message The message to display in the confirmation dialog.
 * @param {string} [confirmButtonText='确认'] The text for the confirmation button.
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
 */
function showConfirm(message, confirmButtonText = '确认') {
    return new Promise(resolve => {
        // Create the modal elements
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'confirm-modal-content';

        const messagePara = document.createElement('p');
        messagePara.textContent = message;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'confirm-modal-buttons';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmButtonText;
        confirmBtn.className = 'btn-confirm';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.className = 'btn-cancel';
        
        // Assemble the modal
        buttonsDiv.appendChild(confirmBtn);
        buttonsDiv.appendChild(cancelBtn);
        modalContent.appendChild(messagePara);
        modalContent.appendChild(buttonsDiv);
        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);

        // Function to close and remove the modal
        const closeModal = (result) => {
            overlay.classList.remove('visible');
            // Wait for the transition to finish before removing
            overlay.addEventListener('transitionend', () => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, { once: true });
            resolve(result);
        };

        // Add event listeners
        confirmBtn.addEventListener('click', () => closeModal(true));
        cancelBtn.addEventListener('click', () => closeModal(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(false);
            }
        });
        
        // Trigger the fade-in animation
        setTimeout(() => {
            overlay.classList.add('visible');
        }, 10);
    });
}

async function handleCardActions(e) {
    e.preventDefault();
    const target = e.target;
    const card = target.closest('.card');
    if (!card) return;

    const teamId = card.dataset.teamId;

    const deleteBtn = target.closest('.team-delete-button-critical');
    if (deleteBtn) {
        const teamName = card.querySelector('h2').textContent;
        const confirmed = await showConfirm(`确定要删除团队 "${teamName}" 吗？此操作不可逆。`, '确认删除');
        if (confirmed) {
            const { error } = await supabase.rpc('manage_team', {
                action: 'DELETE_TEAM',
                payload: { team_id: teamId }
            });
            if (error) {
                showMesg(`删除失败: ${error.message}`, 'error');
            } else {
                showMesg('团队已删除', 'success');
                card.remove();
            }
        }
        return;
    }

    const memberItem = target.closest('.member-item');
    if (!memberItem && !target.closest('.add-member-form')) return;
    
    const userId = memberItem ? memberItem.dataset.userId : null;

    const removeBtn = target.closest('.remove-member-btn');
    if (removeBtn) {
        const memberEmail = memberItem.querySelector('.member-email').textContent;
        const confirmed = await showConfirm(`确定要从团队中移除成员 "${memberEmail}" 吗？`, '确认移除');
        if (confirmed) {
            const { error } = await supabase.rpc('manage_team', {
                action: 'REMOVE_MEMBER',
                payload: { team_id: teamId, user_id: userId }
            });
            if (error) {
                showMesg(`移除失败: ${error.message}`, 'error');
            } else {
                showMesg('成员已移除。', 'success');
                memberItem.remove();
            }
        }
        return;
    }

    const updateRoleBtn = target.closest('.update-role-btn');
    if (updateRoleBtn) {
        const newRole = updateRoleBtn.dataset.newRole;
        const { error } = await supabase.rpc('manage_team', {
            action: 'UPDATE_ROLE',
            payload: { team_id: teamId, user_id: userId, new_role: newRole }
        });
        if (error) {
            showMesg(`角色更新失败: ${error.message}`);
            console.error(error);
        } else {
            showMesg('角色更新成功！');
            await loadUserTeams();
        }
        return;
    }

    const addMemberForm = target.closest('.add-member-form');
    if (addMemberForm) {
        const emailInput = addMemberForm.querySelector('.new-member-email');
        const email = emailInput.value.trim();
        if (!email) return showMesg('请输入邮箱地址。');

        const { error } = await supabase.rpc('manage_team', {
            action: 'ADD_MEMBER',
            payload: { team_id: teamId, email: email }
        });
        if (error) {
            showMesg(`添加失败: ${error.message}`);
        } else {
            showMesg('成员添加成功，正在刷新...');
            await loadUserTeams();
        }
    }
}

function showMesg(message, duration = 3000) {
    // 移除已存在的信息框
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的信息框元素
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // 短暂延迟确保过渡效果生效

    // 设置超时自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        // 在CSS过渡动画结束后从DOM中移除元素
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}