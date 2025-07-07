// Supabase and timeline logic will go here.
const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 新增：通用信息框函数 ---
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

// --- 全局状态 ---
let currentScheduleData = [];
let timelineStartHour = 0;
let timelineEndHour = 24;
const PIXELS_PER_HOUR = 100;
let currentUser = null;
let currentTeams = [];
let selectedTeamId = null;
let realtimeChannel = null;
let clientId = null; // 新增：客户端ID，用于同步
let lastSyncTime = null; // 新增：上次同步时间

const SNAP_MINUTES = 30; // 对齐的分钟数
const SNAP_GRID_PIXELS = (PIXELS_PER_HOUR / 60) * SNAP_MINUTES; // 对应的像素


document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showMesg('请先登录！');
        return;
    }
    currentUser = user;
    
    // 生成唯一的客户端ID
    clientId = `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    console.log(`[初始化] 客户端ID: ${clientId}`);
    
    loadSettings();
    await initializeTeamSelector();
    await initializeTimeline();
    setupEventListeners();
    
    // 启动定期同步机制
    startPeriodicSync();

    // 添加页面关闭事件监听
    window.addEventListener('beforeunload', async (e) => {
        // 发送离线状态广播
        try {
            await broadcastUserStatus('offline');
            console.log('[调试] 已发送离线状态广播');
        } catch (error) {
            console.error('[错误] 发送离线状态广播失败:', error);
        }
    });
});

/**
 * 启动定期同步机制，确保数据与服务器保持同步
 */
function startPeriodicSync() {
    // 每60秒执行一次完整同步
    const syncInterval = setInterval(async () => {
        if (!selectedTeamId) return;
        
        console.log('[调试] 执行定期数据同步...');
        try {
            await syncWithServer();
        } catch (error) {
            console.error('[错误] 定期同步失败:', error);
        }
    }, 60000);
    
    // 页面关闭时清除定时器
    window.addEventListener('beforeunload', () => {
        clearInterval(syncInterval);
    });
    
    // 网络恢复时立即同步
    window.addEventListener('online', async () => {
        console.log('[调试] 网络连接已恢复，执行数据同步...');
        showMesg('网络已连接，正在同步数据...');
        try {
            await syncWithServer();
            showMesg('数据同步完成');
        } catch (error) {
            console.error('[错误] 网络恢复后同步失败:', error);
            showMesg('数据同步失败，请刷新页面');
        }
    });
    
    // 网络断开时通知用户
    window.addEventListener('offline', () => {
        console.log('[警告] 网络连接已断开');
        showMesg('网络已断开，部分功能可能不可用');
    });
}

/**
 * 与服务器同步数据
 * 使用新的后端同步函数获取最新数据
 */
async function syncWithServer() {
    if (!selectedTeamId || !clientId) {
        console.log('[警告] 无法同步：缺少团队ID或客户端ID');
        return;
    }
    
    try {
        console.log(`[同步] 开始同步团队 ${selectedTeamId} 的数据，客户端ID: ${clientId}`);
        
        // 使用新的简化同步函数，完全避免时间戳参数
        const { data, error } = await supabase.rpc('sync_schedules_simple', {
            p_team_id: selectedTeamId,
            p_client_id: clientId
        });
        
        if (error) {
            console.error('[错误] 同步失败:', error);
            return;
        }
        
        console.log('[同步] 收到服务器响应:', data);
        
        // 更新上次同步时间（仅用于日志记录，不再传递给后端）
        lastSyncTime = data.timestamp;
        
        // 处理更新的项目
        if (data.items && data.items.length > 0) {
            console.log(`[同步] 处理 ${data.items.length} 个更新项目`);
            
            // 更新本地缓存
            data.items.forEach(serverItem => {
                const localIndex = currentScheduleData.findIndex(item => item.id === serverItem.id);
                if (localIndex === -1) {
                    // 新项目
                    currentScheduleData.push(serverItem);
                } else {
                    // 更新项目
                    currentScheduleData[localIndex] = serverItem;
                }
            });
        }
        
        // 处理删除的项目
        if (data.deleted && data.deleted.length > 0) {
            console.log(`[同步] 处理 ${data.deleted.length} 个删除项目`);
            
            data.deleted.forEach(deletedItem => {
                // 从本地缓存中移除
                currentScheduleData = currentScheduleData.filter(item => item.id !== deletedItem.id);
                // 从DOM中移除
                removeItemFromDom(deletedItem.id);
            });
        }
        
        // 重新渲染时间条
        renderScheduleItems(currentScheduleData, timelineStartHour);
        
    } catch (error) {
        console.error('[错误] 同步过程中发生异常:', error);
        throw error;
    }
}

async function initializeTeamSelector() {
    const { data: teams, error } = await supabase.rpc('get_user_teams_with_members');
    if (error || !teams) {
        console.error('获取团队列表失败', error);
        return;
    }
    currentTeams = teams;
    const selector = document.getElementById('team-selector');
    selector.innerHTML = '';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        selector.appendChild(option);
    });

    const lastSelected = localStorage.getItem('selectedTeamId');
    if (lastSelected && teams.some(t => t.id == lastSelected)) {
        selector.value = lastSelected;
    }
    
    selectedTeamId = parseInt(selector.value, 10);
    selector.addEventListener('change', (e) => {
        selectedTeamId = parseInt(e.target.value, 10);
        localStorage.setItem('selectedTeamId', selectedTeamId);
        initializeTimeline();
    });
}

async function initializeTimeline() {
    // 1. 移除旧的实时订阅
    if (realtimeChannel) {
        await supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        console.log('已移除旧的实时订阅频道。');
    }

    if (!selectedTeamId) {
        document.getElementById('timeline-lanes').innerHTML = '<p>请先选择一个团队。</p>';
        return;
    }
    console.log(`初始化团队 ${selectedTeamId} 的时间轴范围: ${timelineStartHour} - ${timelineEndHour}`);
    
    const selectedTeam = currentTeams.find(t => t.id == selectedTeamId);
    generateTimeLanes(selectedTeam.members, timelineStartHour, timelineEndHour);

    // 首先尝试使用同步函数获取最新数据
    try {
        await syncWithServer();
        console.log('[初始化] 已通过同步函数获取最新数据');
    } catch (syncError) {
        console.error('[初始化] 同步函数失败，使用传统方法:', syncError);
        
        // 如果同步函数失败，回退到传统方法
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('team_id', selectedTeamId);
        
        if (error) {
            console.error('获取团队排班失败', error);
            return;
        }
        currentScheduleData = data || []; // Update local cache
        renderScheduleItems(currentScheduleData, timelineStartHour);
    }
    
    syncScroll();

    // 2. 创建新的实时订阅频道
    // 修改：使用更简单的频道名称，避免随机字符串可能导致的问题
    const channelName = `schedules:team_${selectedTeamId}`;
    
    // 修改：使用更可靠的实时订阅配置
    realtimeChannel = supabase.channel(channelName, {
        config: {
            broadcast: { self: true }, // 修改：接收自己发出的广播，确保数据一致性
            presence: { key: currentUser.id } // 添加presence功能，跟踪在线用户
        }
    })
    // 订阅排班表变更
    .on('postgres_changes', 
        { 
            event: '*', 
            schema: 'public', 
            table: 'schedules',
            filter: `team_id=eq.${selectedTeamId}` 
        }, 
        (payload) => {
            console.log('接收到排班表实时变更:', payload);
            handleRealtimeUpdate(payload);
        }
    )
    // 订阅删除记录表变更
    .on('postgres_changes', 
        { 
            event: 'INSERT', // 只需要监听插入事件，因为删除记录表只会有新增操作
            schema: 'public', 
            table: 'deleted_schedules',
            filter: `team_id=eq.${selectedTeamId}` 
        }, 
        (payload) => {
            console.log('接收到删除记录表实时变更:', payload);
            handleDeletedRecordEvent(payload);
        }
    )
    // 添加广播频道，用于发送自定义通知
    .on('broadcast', { event: 'schedule_operation' }, (payload) => {
        console.log('接收到广播消息:', payload);
        handleBroadcastMessage(payload);
    })
    .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
            console.log(`已成功订阅团队 ${selectedTeamId} 的排班变更。`);
            // 订阅成功后，立即进行一次全量同步，确保数据是最新的
            await refreshScheduleData();
            
            // 更新同步状态指示器
            updateSyncStatusIndicator('connected');
            
            // 发送在线状态广播
            broadcastUserStatus('online');
        }
        if (status === 'CHANNEL_ERROR') {
            console.error('实时订阅失败:', err);
            showMesg('实时同步连接失败，请刷新页面重试。');
            
            // 更新同步状态指示器
            updateSyncStatusIndicator('error');
            
            // 尝试重新连接
            setTimeout(() => {
                console.log('尝试重新建立实时连接...');
                initializeTimeline();
            }, 5000);
        }
        if (status === 'TIMED_OUT') {
            console.warn('实时连接超时，尝试重新连接...');
            
            // 更新同步状态指示器
            updateSyncStatusIndicator('reconnecting');
            
            // 尝试重新连接
            setTimeout(() => {
                console.log('尝试重新建立实时连接...');
                initializeTimeline();
            }, 3000);
        }
    });
}

// 修改refreshScheduleData函数，使用新的同步函数
async function refreshScheduleData() {
    try {
        await syncWithServer();
    } catch (syncError) {
        console.error('[错误] 刷新数据失败，尝试传统方法:', syncError);
        
        // 如果同步函数失败，回退到传统的刷新方法
        if (!selectedTeamId) return;
        
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('team_id', selectedTeamId);
        
        if (error) {
            console.error('刷新排班数据失败', error);
            return;
        }
        
        // 比较并更新本地缓存
        if (data && data.length > 0) {
            let hasChanges = false;
            
            // 检查新增和更新的项目
            data.forEach(serverItem => {
                const localItem = currentScheduleData.find(item => item.id === serverItem.id);
                if (!localItem) {
                    // 新项目
                    currentScheduleData.push(serverItem);
                    hasChanges = true;
                } else if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
                    // 更新项目
                    Object.assign(localItem, serverItem);
                    hasChanges = true;
                }
            });
            
            // 检查删除的项目
            const serverIds = data.map(item => item.id);
            const deletedItems = currentScheduleData.filter(item => !serverIds.includes(item.id));
            if (deletedItems.length > 0) {
                currentScheduleData = currentScheduleData.filter(item => serverIds.includes(item.id));
                hasChanges = true;
            }
            
            // 如果有变化，重新渲染
            if (hasChanges) {
                console.log('检测到数据变化，重新渲染时间条');
                renderScheduleItems(currentScheduleData, timelineStartHour);
            }
        }
    }
}

function setupEventListeners() {
    // 设置弹窗的事件
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const saveBtn = document.getElementById('save-settings-btn');
    const cancelBtn = document.getElementById('cancel-settings-btn');

    settingsBtn.addEventListener('click', showSettingsModal);
    cancelBtn.addEventListener('click', hideSettingsModal);
    modal.addEventListener('click', (e) => { // 点击背景关闭
        if (e.target === modal) {
            hideSettingsModal();
        }
    });
    saveBtn.addEventListener('click', saveAndRerenderTimeline);

    // 全局点击监听，用于隐藏右键菜单
    window.addEventListener('click', (e) => {
        // 确保点击的不是菜单本身
        const contextMenu = document.getElementById('timeline-context-menu');
        if (contextMenu && !contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // 监听键盘的Escape键来隐藏菜单
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
}

function showContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();

    const contextMenu = document.getElementById('timeline-context-menu');
    hideContextMenu(); // Hide any previous menu

    const target = e.target;
    const isItemClick = target.closest('.schedule-item');

    // Reset all actions
    contextMenu.querySelectorAll('li').forEach(li => li.style.display = 'none');

    if (isItemClick) {
        const itemElement = target.closest('.schedule-item');
        const itemId = itemElement.dataset.id;
        const itemData = findItemDataById(itemId);
        
        contextMenu.dataset.itemId = itemId;

        // Show item-specific actions
        contextMenu.querySelectorAll('.ctx-item-action').forEach(li => li.style.display = 'block');
        
        // Dynamically show/hide type change options
        const changeToWork = contextMenu.querySelector('#ctx-change-to-work');
        const changeToBreak = contextMenu.querySelector('#ctx-change-to-break');
        if (itemData.type === 'break') {
            changeToWork.style.display = 'block';
            changeToBreak.style.display = 'none';
        } else { // 'work' or undefined
            changeToWork.style.display = 'none';
            changeToBreak.style.display = 'block';
        }

    } else {
        const laneBodyWrapper = e.currentTarget;
        const lane = laneBodyWrapper.closest('.lane');
        if (!lane) return;

        const startHour = calculateHourFromClick(e);
        const targetUserId = lane.dataset.userId;

        contextMenu.dataset.userId = targetUserId;
        contextMenu.dataset.startHour = startHour;
        
        // Show lane-specific actions
        contextMenu.querySelectorAll('.ctx-lane-action').forEach(li => li.style.display = 'block');
    }

    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.display = 'block';
    contextMenu.classList.add('visible');
    
    bindContextMenuActions();
}

function bindContextMenuActions() {
    // Unbind previous onclicks to prevent multiple triggers
    document.getElementById('ctx-add-work').onclick = null;
    document.getElementById('ctx-add-break').onclick = null;
    document.getElementById('ctx-delete-item').onclick = null;
    document.getElementById('ctx-change-to-work').onclick = null;
    document.getElementById('ctx-change-to-break').onclick = null;

    document.getElementById('ctx-add-work').onclick = () => handleAddItem('work');
    document.getElementById('ctx-add-break').onclick = () => handleAddItem('break');
    document.getElementById('ctx-delete-item').onclick = () => handleDeleteContext();
    document.getElementById('ctx-change-to-work').onclick = () => handleUpdateType('work');
    document.getElementById('ctx-change-to-break').onclick = () => handleUpdateType('break');
}

function handleAddItem(type) {
    const contextMenu = document.getElementById('timeline-context-menu');
    const targetUserId = contextMenu.dataset.userId;
    const startHour = parseFloat(contextMenu.dataset.startHour);
    createScheduleItemAt(targetUserId, startHour, type);
    hideContextMenu();
}

function handleDeleteContext() {
    const contextMenu = document.getElementById('timeline-context-menu');
    const itemId = contextMenu.dataset.itemId;
    if (itemId) {
        if (confirm('确定要删除这个排班吗？')) {
            deleteScheduleItem(itemId);
        }
    }
    hideContextMenu();
}

async function handleUpdateType(newType) {
    const contextMenu = document.getElementById('timeline-context-menu');
    const itemId = contextMenu.dataset.itemId;
    
    const { data, error } = await supabase
        .from('schedules')
        .update({ type: newType })
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error('更新类型失败:', error);
        showMesg('更新失败');
    } else {
        showMesg('类型已更新');
        // Update local data and re-render
        const index = currentScheduleData.findIndex(item => item.id == itemId);
        if (index !== -1) {
            currentScheduleData[index] = data;
            renderScheduleItems(currentScheduleData, timelineStartHour);
            
            // 发送广播通知其他用户
            broadcastScheduleOperation('update', data);
        }
    }
    
    hideContextMenu();
}

function hideContextMenu() {
    const contextMenu = document.getElementById('timeline-context-menu');
    if (contextMenu) {
        contextMenu.classList.remove('visible');
        // 在动画结束后再隐藏，防止动画被跳过
        setTimeout(() => {
            // 检查visible类是否仍然不存在，以防在计时器期间菜单又被打开
            if (!contextMenu.classList.contains('visible')) {
                contextMenu.style.display = 'none';
            }
        }, 150); // 150ms 略长于CSS中的过渡时间
    }
}

async function handleCreateNewItem(e) {
    // 确保只在空白区域双击时创建
    if (e.target.classList.contains('schedule-item')) {
        return;
    }

    const startHour = calculateHourFromClick(e);
    const lane = e.currentTarget.closest('.lane');
    const targetUserId = lane.dataset.userId;
    
    await createScheduleItemAt(targetUserId, startHour);
}

function calculateHourFromClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const startPixel = Math.floor(clickX / SNAP_GRID_PIXELS) * SNAP_GRID_PIXELS;
    return (startPixel / PIXELS_PER_HOUR) + timelineStartHour;
}

async function createScheduleItemAt(userId, startHour, type = 'work') {
    console.log(`[调试] 创建排班，用户ID: ${userId}, 开始小时: ${startHour}, 类型: ${type}`);
    
    if (!userId || isNaN(startHour)) {
        console.error('[错误] 创建排班缺少必要参数:', { userId, startHour, type });
        showMesg('创建排班失败：参数无效');
        return;
    }
    
    try {
        // 确保userId是字符串类型
        userId = String(userId);
        
        // 创建一个基于今天日期的时间点
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 重置到今天的0点
        
        // 计算开始和结束时间
        const startTimeMs = today.getTime() + (startHour * 60 * 60 * 1000);
        const endTimeMs = startTimeMs + (60 * 60 * 1000); // 默认1小时
        
        const startTime = new Date(startTimeMs);
        const endTime = new Date(endTimeMs);
        
        console.log(`[调试] 计算的时间 - 开始: ${startTime.toISOString()}, 结束: ${endTime.toISOString()}`);
        
        // 创建新项目对象
        const newItem = {
            user_id: userId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            task_description: type === 'work' ? '工作班次' : '休息时间',
            type: type // 确保类型字段存在
        };
        
        await createScheduleInDb(newItem);
    } catch (error) {
        console.error('[错误] 创建排班时发生异常:', error);
        showMesg('创建排班失败，请稍后重试');
    }
}

async function createScheduleInDb(newItem) {
    console.log('[调试] 正在创建新排班...', newItem);

    try {
        // 确保team_id是数字类型
        const teamId = parseInt(selectedTeamId, 10);
        if (isNaN(teamId)) {
            console.error('[错误] 无效的团队ID:', selectedTeamId);
            showMesg('创建失败：无效的团队ID');
            return;
        }

        // 确保user_id是字符串类型
        newItem.user_id = String(newItem.user_id);
        
        // 添加团队ID到项目
        const itemToInsert = { 
            ...newItem, 
            team_id: teamId,
            created_at: new Date().toISOString(), // 添加创建时间
            version: 1 // 添加version字段，初始值为1
        };

        console.log('[调试] 准备插入数据:', itemToInsert);

        const { data, error } = await supabase
            .from('schedules')
            .insert([itemToInsert])
            .select()
            .single();

        if (error) {
            console.error('[错误] 创建排班失败:', error);
            showMesg('创建失败，请稍后重试。');
            return null;
        } 
        
        console.log('[成功] 创建成功:', data);
        
        // 添加到本地缓存
        currentScheduleData.push(data);
        
        // 渲染到UI
        renderOrUpdateItem(data, timelineStartHour);
        console.log('[调试] 乐观UI更新已执行 (创建)');
        
        // 发送广播通知其他用户
        broadcastScheduleOperation('create', data);
        
        return data;
    } catch (error) {
        console.error('[错误] 创建排班过程中发生异常:', error);
        showMesg('创建失败，发生未知错误');
        return null;
    }
}

function syncScroll() {
    const timelineHeader = document.getElementById('timeline-header');
    const allLaneBodies = document.querySelectorAll('.lane-body');

    if (allLaneBodies.length > 0 && timelineHeader) {
        // 同步所有泳道的滚动到头部
        allLaneBodies.forEach(laneBody => {
            laneBody.addEventListener('scroll', () => {
                timelineHeader.scrollLeft = laneBody.scrollLeft;
            });
        });
        
        // 将所有泳道的滚动互相绑定 (可选，但体验更好)
        allLaneBodies.forEach(scroller => {
            scroller.addEventListener('scroll', () => {
                allLaneBodies.forEach(otherScroller => {
                    if (otherScroller !== scroller) {
                        otherScroller.scrollLeft = scroller.scrollLeft;
                    }
                });
            });
        });
    }
}

/**
 * 从 Supabase 获取排班数据
 */
async function fetchScheduleData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showMesg('无法验证用户信息，请重新登录。');
        // 在实际应用中，可能会重定向到登录页
        return null;
    }

    console.log(`正在为用户 ${user.id} 获取排班数据...`);

    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('获取排班数据失败:', error);
        return null;
    }

    console.log('成功获取排班数据:', data);
    currentScheduleData = data; // 缓存数据
    return data;
}

function generateTimeLanes(members, start, end) {
    const timelineLanesContainer = document.getElementById('timeline-lanes');
    timelineLanesContainer.innerHTML = ''; // 清空旧泳道

    const totalHours = end - start;
    const timelineWidth = totalHours * PIXELS_PER_HOUR;

    generateTimeTicks(start, end, timelineWidth); // 传入宽度

    members.forEach(member => {
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.dataset.userId = member.user_id;

        lane.innerHTML = `
            <div class="lane-header">
                <span>${member.full_name || member.email}</span>
            </div>
            <div class="lane-body">
                <div class="lane-body-content-wrapper" style="width: ${timelineWidth}px;"></div>
            </div>
        `;
        timelineLanesContainer.appendChild(lane);

        // 为每个泳道的背景绑定右键菜单和双击事件
        const laneBody = lane.querySelector('.lane-body');
        laneBody.addEventListener('contextmenu', showContextMenu);
        laneBody.addEventListener('dblclick', handleCreateNewItem);
    });
}

function generateTimeTicks(start, end, width) {
    const timelineHeader = document.getElementById('timeline-header');
    timelineHeader.innerHTML = '';

    // --- 新增：创建与 lane-header 等宽的空白占位符 ---
    const headerSpacer = document.createElement('div');
    headerSpacer.className = 'lane-header-spacer';
    headerSpacer.style.width = '150px'; // 与 .lane-header 宽度一致
    headerSpacer.style.flexShrink = '0'; // 防止缩放
    headerSpacer.style.borderRight = '1px solid #282828'; // 保持竖线对齐
    timelineHeader.appendChild(headerSpacer);
    // --- 结束新增 ---

    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'ticks-container';
    ticksContainer.style.width = `${width}px`;
    
    for (let hour = start; hour < end; hour++) {
        const tick = document.createElement('div');
        tick.className = 'time-tick';
        
        // 显示小时，对24取模以正确显示次日时间
        tick.textContent = `${String(hour % 24).padStart(2, '0')}:00`;

        // 如果是新的一天的开始 (0点)，添加特殊样式
        if (hour > 0 && hour % 24 === 0) {
            tick.classList.add('day-separator');
        }

        ticksContainer.appendChild(tick);
    }
    timelineHeader.appendChild(ticksContainer);
}

/**
 * 渲染排班条目
 * @param {Array} items - 排班数据数组
 */
function renderScheduleItems(items, timelineStart) {
    // 只清空旧的排班条目，而不是整个泳道内容
    document.querySelectorAll('.schedule-item').forEach(item => item.remove());

    if (!items) return;

    items.forEach(item => {
        renderOrUpdateItem(item, timelineStart);
    });
}

function makeEditable(textSpan, itemId) {
    // 防止重复创建input
    if (textSpan.querySelector('input')) return;

    const currentText = textSpan.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';

    input.addEventListener('blur', async () => {
        const newText = input.value.trim();
        textSpan.textContent = newText || "新任务";
        
        if (newText !== currentText) {
            await updateScheduleTask(itemId, newText);
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            input.value = currentText; // 恢复原值
            input.blur();
        }
    });

    textSpan.textContent = '';
    textSpan.appendChild(input);
    input.focus();
    input.select();
}

async function updateScheduleTask(id, newTask) {
    console.log(`正在更新 ID: ${id} 的任务描述...`);
    
    const { data, error } = await supabase
        .from('schedules')
        .update({ task_description: newTask })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('更新任务描述失败:', error);
        showMesg('更新任务描述失败，请稍后重试。');
    } else {
        console.log('任务描述更新成功。');
        const itemIndex = currentScheduleData.findIndex(item => item.id == id);
        if (itemIndex !== -1) {
            currentScheduleData[itemIndex] = data;
            
            // 发送广播通知其他用户
            broadcastScheduleOperation('update', data);
        }
    }
}

async function handleDeleteItem(e) {
    e.stopPropagation(); // 防止触发父元素的其他事件

    const itemElement = e.currentTarget.parentElement;
    const itemId = itemElement.dataset.id;

    if (itemId && confirm('确定要删除这个排班吗？')) {
        await deleteScheduleItem(itemId);
    }
}

async function deleteScheduleItem(itemId) {
    console.log(`[调试] 正在删除排班，ID: ${itemId}`);
    
    try {
        // 确保itemId是有效的
        if (!itemId) {
            console.error('[错误] 删除排班失败：无效的ID');
            showMesg('删除失败：无效的ID');
            return false;
        }
        
        // 先保存被删除项目的数据，用于广播
        const deletedItem = findItemDataById(itemId);
        if (!deletedItem) {
            console.error(`[错误] 未找到ID为 ${itemId} 的排班数据，无法删除。`);
            showMesg('删除失败：未找到排班数据');
            return false;
        }
        
        // 保存一份完整的数据副本，用于后续广播
        const itemForBroadcast = {...deletedItem};
        
        console.log(`[调试] 准备删除排班，数据:`, itemForBroadcast);
        
        // 使用RPC函数替代直接删除
        const { data, error } = await supabase
            .rpc('delete_schedule_safely', {
                p_schedule_id: parseInt(itemId, 10)
            });

        if (error) {
            console.error('[错误] 删除排班失败:', error);
            showMesg('删除失败，请稍后重试。');
            return false;
        }
        
        console.log('[成功] 删除排班RPC结果:', data);
        
        if (!data.success) {
            console.error('[错误] 删除排班失败:', data.message);
            showMesg(`删除失败: ${data.message}`);
            return false;
        }
        
        // 从UI和缓存中移除
        const itemElement = document.querySelector(`.schedule-item[data-id="${itemId}"]`);
        if (itemElement) {
            itemElement.remove();
        }
        
        // 从本地缓存中移除
        currentScheduleData = currentScheduleData.filter(item => item.id != itemId);
        
        // 显示成功消息
        showMesg('排班已删除。');
        
        // 发送广播通知其他用户
        broadcastScheduleOperation('delete', itemForBroadcast);
        
        return true;
    } catch (error) {
        console.error('[错误] 删除排班过程中发生异常:', error);
        showMesg('删除失败，发生未知错误');
        return false;
    }
}

function handleResizeStart(e) {
    e.stopPropagation(); // 防止触发拖拽
    e.preventDefault();

    const itemElement = e.currentTarget.parentElement;
    const handleSide = e.currentTarget.classList.contains('left') ? 'left' : 'right';

    itemElement.classList.add('resizing');

    const startX = e.clientX;
    const initialLeft = itemElement.offsetLeft;
    const initialWidth = itemElement.offsetWidth;
    const minWidth = SNAP_GRID_PIXELS; // 最小宽度为30分钟

    function handleResizeMove(e) {
        const deltaX = e.clientX - startX;

        if (handleSide === 'right') {
            let newWidth = initialWidth + deltaX;
            newWidth = Math.round(newWidth / SNAP_GRID_PIXELS) * SNAP_GRID_PIXELS;
            newWidth = Math.max(minWidth, newWidth);
            itemElement.style.width = `${newWidth}px`;
        } else { // left handle
            let newLeft = initialLeft + deltaX;
            let newWidth = initialWidth - deltaX;

            // 吸附
            const snappedLeft = Math.round(newLeft / SNAP_GRID_PIXELS) * SNAP_GRID_PIXELS;
            const snappedWidth = Math.round(newWidth / SNAP_GRID_PIXELS) * SNAP_GRID_PIXELS;
            
            if (snappedWidth >= minWidth) {
                itemElement.style.left = `${snappedLeft}px`;
                itemElement.style.width = `${snappedWidth}px`;
            }
        }
    }

    function handleResizeEnd(e) {
        itemElement.classList.remove('resizing');
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);

        const finalLeft = itemElement.offsetLeft;
        const finalWidth = itemElement.offsetWidth;

        // 如果尺寸和位置没变，则不更新
        if (finalLeft === initialLeft && finalWidth === initialWidth) {
            return;
        }

        const pixelsPerHour = 100;
        // 关键改动：计算时间要加上起点
        const newStartHour = (finalLeft / PIXELS_PER_HOUR) + timelineStartHour;
        const newEndHour = ((finalLeft + finalWidth) / PIXELS_PER_HOUR) + timelineStartHour;

        const itemId = itemElement.dataset.id;
        const itemData = findItemDataById(itemId);
        if (!itemData) return;

        const originalStartTime = new Date(itemData.start_time);
        const newStartTime = new Date(originalStartTime);
        newStartTime.setHours(0, 0, 0, 0);
        newStartTime.setMilliseconds(newStartHour * 60 * 60 * 1000);

        const newEndTime = new Date(originalStartTime);
        newEndTime.setHours(0, 0, 0, 0);
        newEndTime.setMilliseconds(newEndHour * 60 * 60 * 1000);

        // 对于从左侧拉伸，确保日期也可能需要调整
        if (newEndTime < newStartTime) {
            newEndTime.setDate(newEndTime.getDate() + 1);
            // 如果调整后还是不对，可能需要更复杂的逻辑，但对于常见场景足够
        }

        updateScheduleTime(itemId, newStartTime.toISOString(), newEndTime.toISOString());
    }

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}

function handleDragStart(e) {
    // 只响应左键点击
    if (e.button !== 0) return;
    
    e.preventDefault();

    const itemElement = e.currentTarget;
    itemElement.classList.add('dragging');

    const startX = e.clientX;
    const initialLeft = itemElement.offsetLeft;

    function handleDragMove(e) {
        // 1. 计算鼠标位移
        const deltaX = e.clientX - startX;
        let newLeft = initialLeft + deltaX;

        // 2. 实现网格吸附
        // 计算最接近的吸附点
        newLeft = Math.round(newLeft / SNAP_GRID_PIXELS) * SNAP_GRID_PIXELS;

        // 3. 边界检查 (防止拖出时间轴)
        const timelineWidth = itemElement.parentElement.offsetWidth;
        const itemWidth = itemElement.offsetWidth;
        newLeft = Math.max(0, Math.min(newLeft, timelineWidth - itemWidth));

        // 4. 更新位置
        itemElement.style.left = `${newLeft}px`;
    }

    function handleDragEnd(e) {
        itemElement.classList.remove('dragging');
        
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);

        // --- 更新数据库 ---
        const finalLeft = itemElement.offsetLeft;

        // 检查位置是否真的改变了，避免不必要的数据库更新
        if (finalLeft === initialLeft) {
            console.log("位置未改变，无需更新。");
            return;
        }

        const pixelsPerHour = 100;
        // 关键改动：计算时间要加上起点
        const newStartHour = (finalLeft / PIXELS_PER_HOUR) + timelineStartHour;

        const itemId = itemElement.dataset.id;
        
        // 我们需要原始的 start_time 和 end_time 来计算时长
        // (这里可以从一个全局变量或元素的其他data属性获取，暂时先用一个假想的函数)
        // 更好的做法是在 DragStart 时就缓存好item的完整数据对象
        const itemData = findItemDataById(itemId); // 这是一个需要我们实现的辅助函数
        if (!itemData) return;

        const originalStartTime = new Date(itemData.start_time);
        const originalEndTime = new Date(itemData.end_time);
        const durationMs = originalEndTime.getTime() - originalStartTime.getTime();

        const newStartTime = new Date(originalStartTime);
        newStartTime.setHours(0, 0, 0, 0); // 重置到当天的零点
        newStartTime.setMilliseconds(newStartHour * 60 * 60 * 1000);

        const newEndTime = new Date(newStartTime.getTime() + durationMs);

        const targetLane = itemElement.closest('.lane');
        const targetUserId = targetLane.dataset.userId;

        // 如果泳道改变了，user_id也需要更新
        const newOwnerId = itemData.user_id != targetUserId ? targetUserId : undefined;

        updateScheduleTime(itemId, newStartTime.toISOString(), newEndTime.toISOString(), newOwnerId);
    }

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

/**
 * 提供一些假的排班数据用于测试
 */
function getMockData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    return [
        {
            id: 1,
            user_id: 'mock_user',
            start_time: new Date(year, month, day, 2, 30).toISOString(),
            end_time: new Date(year, month, day, 5, 0).toISOString(),
            task_description: '策划会议'
        },
        {
            id: 2,
            user_id: 'mock_user',
            start_time: new Date(year, month, day, 9, 0).toISOString(),
            end_time: new Date(year, month, day, 11, 45).toISOString(),
            task_description: 'UI/UX 设计评审'
        },
        {
            id: 3,
            user_id: 'mock_user',
            start_time: new Date(year, month, day, 14, 0).toISOString(),
            end_time: new Date(year, month, day, 16, 15).toISOString(),
            task_description: '代码实现与单元测试'
        }
    ];
} 

// --- 设置和弹窗逻辑 ---
function showSettingsModal() {
    document.getElementById('start-hour-input').value = timelineStartHour;
    document.getElementById('end-hour-input').value = timelineEndHour;
    document.getElementById('settings-modal').style.display = 'flex';
}
function hideSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}
function loadSettings() {
    const savedStart = localStorage.getItem('timelineStartHour');
    const savedEnd = localStorage.getItem('timelineEndHour');
    if (savedStart !== null && savedEnd !== null) {
        timelineStartHour = parseInt(savedStart, 10);
        timelineEndHour = parseInt(savedEnd, 10);
    }
}
async function saveAndRerenderTimeline() {
    const startInput = document.getElementById('start-hour-input');
    const endInput = document.getElementById('end-hour-input');
    let newStart = parseInt(startInput.value, 10);
    let newEnd = parseInt(endInput.value, 10);

    if (isNaN(newStart) || isNaN(newEnd) || newStart >= newEnd || newStart < 0 || newEnd > 48) {
        showMesg('请输入有效的起止时间 (0-48)，且开始时间必须小于结束时间。');
        return;
    }
    
    timelineStartHour = newStart;
    timelineEndHour = newEnd;
    localStorage.setItem('timelineStartHour', timelineStartHour);
    localStorage.setItem('timelineEndHour', timelineEndHour);

    await initializeTimeline();
    hideSettingsModal();
}

// --- 辅助函数 ---
function findItemDataById(id) {
    console.log(`[调试] 查找排班数据，ID: ${id}, 类型: ${typeof id}`);
    
    if (!id) {
        console.error('[错误] 查找排班数据失败：ID为空');
        return null;
    }
    
    // 确保currentScheduleData是有效的数组
    if (!Array.isArray(currentScheduleData)) {
        console.error('[错误] 排班数据缓存无效');
        return null;
    }
    
    try {
        // 尝试不同的比较方式，增强健壮性
        // 首先尝试严格相等
        let item = currentScheduleData.find(item => item.id === id);
        
        // 如果没找到，尝试宽松相等（处理字符串vs数字的情况）
        if (!item) {
            item = currentScheduleData.find(item => item.id == id);
        }
        
        // 如果还是没找到，尝试将两者都转为字符串比较
        if (!item) {
            const idStr = String(id);
            item = currentScheduleData.find(item => String(item.id) === idStr);
        }
        
        if (item) {
            console.log(`[调试] 找到排班数据:`, item);
        } else {
            console.warn(`[警告] 未找到ID为 ${id} 的排班数据`);
        }
        
        return item || null;
    } catch (error) {
        console.error('[错误] 查找排班数据时发生异常:', error);
        return null;
    }
}

async function updateScheduleTime(id, newStartTime, newEndTime, newOwnerId) {
    const { data, error } = await supabase
        .from('schedules')
        .update({
            start_time: newStartTime,
            end_time: newEndTime,
            user_id: newOwnerId
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating schedule time:', error);
        showMesg('更新失败，正在恢复...');
        // Revert UI on failure
        renderOrUpdateItem(findItemDataById(id), timelineStartHour);
    } else {
        // Update local cache
        const index = currentScheduleData.findIndex(item => item.id == id);
        if (index !== -1) {
            currentScheduleData[index] = data;
            renderOrUpdateItem(data, timelineStartHour);
            console.log('[调试] 乐观UI更新已执行 (移动/缩放)');
            
            // 发送广播通知其他用户
            broadcastScheduleOperation('update', data);
        }
    }
}

// --- 以下为新增的实时更新相关函数 ---

/**
 * 处理从 Supabase Realtime 收到的数据变更事件。
 * @param {object} payload - Supabase 发送的负载对象。
 */
function handleRealtimeUpdate(payload) {
    try {
        console.log('[调试] 接收到实时事件:', JSON.stringify(payload));
        
        if (!payload || !payload.eventType) {
            console.error('[错误] 实时事件缺少必要字段:', payload);
            return;
        }
        
        // 记录事件类型和时间戳，便于调试
        const now = new Date().toISOString();
        console.log(`[${now}] 处理 ${payload.eventType} 事件，表: ${payload.table}，ID: ${payload.new?.id || payload.old?.id}`);
        
        switch (payload.eventType) {
            case 'INSERT':
                handleInsertEvent(payload);
                break;
            case 'UPDATE':
                handleUpdateEvent(payload);
                break;
            case 'DELETE':
                handleDeleteEvent(payload);
                break;
            default:
                console.warn('[警告] 未知的事件类型:', payload.eventType);
                break;
        }
    } catch (error) {
        console.error('[严重错误] 处理实时事件时发生异常:', error);
        showMesg('同步数据时出错，请刷新页面');
    }
}

/**
 * 处理INSERT类型的实时事件
 * @param {object} payload - Supabase 发送的负载对象
 */
function handleInsertEvent(payload) {
    if (!payload.new || !payload.new.id) {
        console.error('[错误] INSERT事件缺少新数据:', payload);
        return;
    }
    
    // 检查是否已存在于本地缓存中
    const existingIndex = currentScheduleData.findIndex(item => item.id === payload.new.id);
    
    if (existingIndex !== -1) {
        console.log(`[调试] 条目 ${payload.new.id} 已存在于本地缓存中，跳过INSERT处理`);
        // 如果已存在但数据不同，更新它
        if (JSON.stringify(currentScheduleData[existingIndex]) !== JSON.stringify(payload.new)) {
            console.log(`[调试] 但数据不同，更新本地缓存`);
            currentScheduleData[existingIndex] = payload.new;
            renderOrUpdateItem(payload.new, timelineStartHour);
        }
    } else {
        // 新增到本地缓存
        console.log(`[调试] 来自云端的同步：新增条目 ${payload.new.id}`);
        currentScheduleData.push(payload.new);
        renderOrUpdateItem(payload.new, timelineStartHour);
        
        // 显示通知
        if (payload.new.user_id !== currentUser.id) {
            const teamMember = findTeamMember(payload.new.user_id);
            const userName = teamMember ? (teamMember.full_name || teamMember.email) : '团队成员';
            showMesg(`${userName} 添加了新的排班`);
        }
    }
}

/**
 * 处理UPDATE类型的实时事件
 * @param {object} payload - Supabase 发送的负载对象
 */
function handleUpdateEvent(payload) {
    if (!payload.new || !payload.new.id) {
        console.error('[错误] UPDATE事件缺少新数据:', payload);
        return;
    }
    
    console.log(`[调试] 来自云端的同步：更新条目 ${payload.new.id}`);
    
    // 查找本地缓存中的索引
    const index = currentScheduleData.findIndex(item => item.id === payload.new.id);
    
    if (index !== -1) {
        // 检查是否有实质性变化
        const oldItem = currentScheduleData[index];
        const hasChanges = JSON.stringify(oldItem) !== JSON.stringify(payload.new);
        
        if (hasChanges) {
            console.log(`[调试] 检测到实质性变化，更新本地缓存和UI`);
            // 更新本地缓存
            currentScheduleData[index] = payload.new;
            
            // 更新UI
            renderOrUpdateItem(payload.new, timelineStartHour);
            
            // 显示通知（如果不是当前用户的操作）
            if (payload.new.user_id !== currentUser.id) {
                const teamMember = findTeamMember(payload.new.user_id);
                const userName = teamMember ? (teamMember.full_name || teamMember.email) : '团队成员';
                showMesg(`${userName} 更新了排班`);
            }
        } else {
            console.log(`[调试] 没有检测到变化，跳过更新`);
        }
    } else {
        // 如果本地没有这个条目，作为新条目添加
        console.log(`[调试] 本地缓存中不存在ID为 ${payload.new.id} 的条目，作为新条目添加`);
        currentScheduleData.push(payload.new);
        renderOrUpdateItem(payload.new, timelineStartHour);
    }
}

/**
 * 处理DELETE类型的实时事件
 * @param {object} payload - Supabase 发送的负载对象
 */
function handleDeleteEvent(payload) {
    if (!payload.old || !payload.old.id) {
        console.error('[错误] DELETE事件缺少旧数据:', payload);
        return;
    }
    
    console.log(`[调试] 来自云端的同步：删除条目 ${payload.old.id}`);
    
    // 从本地缓存中移除
    const removedItems = currentScheduleData.filter(item => item.id === payload.old.id);
    currentScheduleData = currentScheduleData.filter(item => item.id !== payload.old.id);
    
    // 从DOM中移除
    removeItemFromDom(payload.old.id);
    
    // 显示通知（如果不是当前用户的操作且确实删除了条目）
    if (removedItems.length > 0 && removedItems[0].user_id !== currentUser.id) {
        const teamMember = findTeamMember(removedItems[0].user_id);
        const userName = teamMember ? (teamMember.full_name || teamMember.email) : '团队成员';
        showMesg(`${userName} 删除了一个排班`);
    }
}

/**
 * 处理从 deleted_schedules 表接收到的实时事件
 * @param {object} payload - Supabase 发送的负载对象
 */
function handleDeletedRecordEvent(payload) {
    if (!payload.new || !payload.new.id) {
        console.error('[错误] 删除记录事件缺少新数据:', payload);
        return;
    }

    console.log(`[调试] 来自云端的同步：新增删除记录 ${payload.new.id}`);

    // 从本地缓存中移除
    const removedItems = currentScheduleData.filter(item => item.id === payload.new.id);
    currentScheduleData = currentScheduleData.filter(item => item.id !== payload.new.id);

    // 从DOM中移除
    removeItemFromDom(payload.new.id);

    // 显示通知（如果不是当前用户的操作且确实删除了条目）
    if (removedItems.length > 0 && removedItems[0].user_id !== currentUser.id) {
        const teamMember = findTeamMember(removedItems[0].user_id);
        const userName = teamMember ? (teamMember.full_name || teamMember.email) : '团队成员';
        showMesg(`${userName} 删除了一个排班`);
    }
}

/**
 * 处理从广播频道接收到的自定义通知
 * @param {object} payload - Supabase 发送的负载对象
 */
function handleBroadcastMessage(payload) {
    if (!payload) {
        console.error('[错误] 接收到空的广播消息');
        return;
    }

    // 添加详细日志，输出完整的payload结构
    console.log('[调试] 接收到广播消息完整结构:', JSON.stringify(payload));

    // 检查payload的结构，确保能正确提取数据
    // Supabase广播消息可能有不同的结构，需要适应这些变化
    let eventType = payload.event;
    let eventData = payload.payload;

    // 如果没有payload.payload但有payload.data，使用payload.data
    if (!eventData && payload.data) {
        eventData = payload.data;
        console.log('[调试] 使用payload.data作为事件数据');
    }

    // 如果eventData本身包含operation和item，则可能是直接传递了整个对象
    if (!eventType && eventData && eventData.operation) {
        eventType = 'schedule_operation';
        console.log('[调试] 从数据中推断事件类型为schedule_operation');
    }

    if (!eventType) {
        console.error('[错误] 广播消息缺少事件类型:', payload);
        return;
    }

    if (!eventData) {
        console.error('[错误] 广播消息缺少数据:', payload);
        return;
    }

    console.log(`[调试] 处理广播消息: ${eventType} - ${JSON.stringify(eventData)}`);

    switch (eventType) {
        case 'user_status_update':
            handleUserStatusUpdate(eventData);
            break;
        case 'schedule_operation':
            handleScheduleOperationBroadcast(eventData);
            break;
        default:
            console.warn('[警告] 未知广播事件类型:', eventType);
            break;
    }
}

/**
 * 处理排班操作广播
 * @param {object} data - 包含 operation 和 item 的数据
 */
function handleScheduleOperationBroadcast(data) {
    // 详细记录接收到的数据，帮助调试
    console.log('[调试] 处理排班操作广播，接收数据:', JSON.stringify(data));

    // 检查数据完整性
    if (!data) {
        console.error('[错误] 排班操作广播数据为空');
        return;
    }

    // 检查operation字段
    if (!data.operation) {
        console.error('[错误] 排班操作广播缺少operation字段:', data);
        // 尝试从数据结构中推断操作类型
        if (data.type) {
            data.operation = data.type;
            console.log('[调试] 使用data.type作为operation:', data.operation);
        } else {
            return; // 无法处理，直接返回
        }
    }

    // 检查item字段
    if (!data.item) {
        console.error('[错误] 排班操作广播缺少item字段:', data);
        // 尝试从数据结构中找到item数据
        if (data.record || data.new || data.old) {
            data.item = data.record || data.new || data.old;
            console.log('[调试] 从其他字段提取item数据:', data.item);
        } else {
            return; // 无法处理，直接返回
        }
    }

    // 确保item有必要的字段
    const item = data.item;
    if (!item.id) {
        console.error('[错误] 排班项目缺少id字段:', item);
        return;
    }

    // 如果是自己发出的广播，跳过处理
    if (item.user_id === currentUser.id) {
        console.log('[调试] 跳过自己发出的广播');
        return;
    }

    // 查找团队成员信息
    const teamMember = findTeamMember(item.user_id);
    const userName = teamMember ? (teamMember.full_name || teamMember.email) : '团队成员';
    let message = '';

    // 根据操作类型处理
    switch (data.operation) {
        case 'create':
        case 'insert':  // 兼容可能的其他命名
            message = `${userName} 添加了新的排班`;
            // 添加到本地缓存并渲染
            if (!currentScheduleData.some(i => i.id === item.id)) {
                currentScheduleData.push(item);
                renderOrUpdateItem(item, timelineStartHour);
            }
            break;
        case 'update':
            message = `${userName} 更新了排班`;
            // 更新本地缓存并重新渲染
            const index = currentScheduleData.findIndex(i => i.id === item.id);
            if (index !== -1) {
                currentScheduleData[index] = item;
                renderOrUpdateItem(item, timelineStartHour);
            } else {
                // 如果本地没有，添加到缓存并渲染
                currentScheduleData.push(item);
                renderOrUpdateItem(item, timelineStartHour);
            }
            break;
        case 'delete':
            message = `${userName} 删除了排班`;
            // 从本地缓存和DOM中移除
            currentScheduleData = currentScheduleData.filter(i => i.id !== item.id);
            removeItemFromDom(item.id);
            break;
        default:
            console.warn('[警告] 未知排班操作类型:', data.operation);
            return;
    }

    showMesg(message);
}

/**
 * 处理用户在线状态更新
 * @param {object} data - 包含 user_id 和 status 的数据
 */
function handleUserStatusUpdate(data) {
    if (!data || !data.user_id || !data.status) {
        console.error('[错误] 用户状态更新缺少必要字段:', data);
        return;
    }

    const teamMember = findTeamMember(data.user_id);
    if (!teamMember) {
        console.warn(`[警告] 未找到用户 ${data.user_id} 的团队成员信息。`);
        return;
    }

    const userName = teamMember.full_name || teamMember.email;
    let message = `${userName} 已`;

    if (data.status === 'online') {
        message += '上线';
    } else if (data.status === 'offline') {
        message += '下线';
    }

    showMesg(message);
}

/**
 * 更新同步状态指示器
 * @param {string} status - 'connected', 'error', 'reconnecting'
 */
function updateSyncStatusIndicator(status) {
    const syncStatusIndicator = document.getElementById('sync-status');
    if (syncStatusIndicator) {
        syncStatusIndicator.textContent = status;
        syncStatusIndicator.className = `sync-status ${status}`;
    }
}

/**
 * 发送用户在线状态广播
 * @param {string} status - 'online' 或 'offline'
 */
async function broadcastUserStatus(status) {
    if (!realtimeChannel) {
        console.warn('实时频道未初始化，无法发送广播。');
        return;
    }

    try {
        await realtimeChannel.send({
            type: 'broadcast',
            event: 'user_status_update',
            data: {
                user_id: currentUser.id,
                status: status
            }
        });
        console.log(`[调试] 发送用户在线状态广播: ${status}`);
    } catch (error) {
        console.error('[错误] 发送用户在线状态广播失败:', error);
    }
}

/**
 * 发送排班操作广播
 * @param {string} operation - 'create', 'update', 'delete'
 * @param {object} data - 排班数据对象
 */
async function broadcastScheduleOperation(operation, data) {
    if (!realtimeChannel) {
        console.warn('实时频道未初始化，无法发送广播。');
        return;
    }

    // 确保操作类型有效
    if (!['create', 'update', 'delete'].includes(operation)) {
        console.error('[错误] 无效的排班操作类型:', operation);
        return;
    }

    // 确保数据对象有效
    if (!data || !data.id) {
        console.error('[错误] 排班数据无效:', data);
        return;
    }

    try {
        // 构造广播消息，确保格式一致
        const broadcastData = {
            operation: operation,
            item: data
        };

        // 发送广播
        await realtimeChannel.send({
            type: 'broadcast',
            event: 'schedule_operation',
            payload: broadcastData  // 使用payload字段，与Supabase的广播格式保持一致
        });

        console.log(`[调试] 发送排班操作广播: ${operation} - ${JSON.stringify(data)}`);
    } catch (error) {
        console.error('[错误] 发送排班操作广播失败:', error);
    }
}

/**
 * 根据用户ID查找团队成员信息
 * @param {string} userId - 用户ID
 * @returns {object|null} 团队成员对象或null
 */
function findTeamMember(userId) {
    if (!currentTeams || !selectedTeamId) return null;
    
    const team = currentTeams.find(t => t.id == selectedTeamId);
    if (!team || !team.members) return null;
    
    return team.members.find(m => m.user_id === userId);
}

/**
 * 根据ID从DOM中移除一个排班条目元素。
 * @param {string|number} itemId - 要移除的排班条目ID。
 */
function removeItemFromDom(itemId) {
    const itemElement = document.querySelector(`.schedule-item[data-id='${itemId}']`);
    if (itemElement) {
        itemElement.remove();
    }
}

/**
 * 在时间轴上创建或更新单个排班条目，避免完全重绘。
 * @param {object} item - 要渲染或更新的排班数据对象。
 * @param {number} timelineStart - 时间轴的起始小时。
 */
function renderOrUpdateItem(item, timelineStart) {
    // 确保参数有效
    if (!item || !item.id || !item.start_time || !item.end_time) {
        console.error('[错误] 渲染排班条目时缺少必要数据:', item);
        return;
    }
    
    // 查找对应泳道
    const lane = document.querySelector(`.lane[data-user-id="${item.user_id}"] .lane-body-content-wrapper`);
    if (!lane) {
        console.warn(`[警告] 未找到用户 ${item.user_id} 的泳道，无法渲染条目 ${item.id}`);
        return;
    }

    // 查找现有元素或创建新元素
    let itemEl = document.querySelector(`.schedule-item[data-id="${item.id}"]`);

    // 如果元素不存在，则创建
    if (!itemEl) {
        console.log(`[调试] 创建新的排班条目元素: ${item.id}`);
        itemEl = document.createElement('div');
        itemEl.className = 'schedule-item';
        itemEl.dataset.id = item.id;
        
        // 仅在创建时添加事件监听器
        itemEl.addEventListener('contextmenu', showContextMenu);
        itemEl.addEventListener('mousedown', handleDragStart);

        // 创建删除按钮
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', handleDeleteItem);
        itemEl.appendChild(deleteBtn);

        // 创建可编辑的文本区域
        const textSpan = document.createElement('span');
        textSpan.className = 'item-text';
        itemEl.appendChild(textSpan);
        
        // 创建调整大小的把手
        const leftHandle = document.createElement('div');
        leftHandle.className = 'resize-handle left';
        leftHandle.addEventListener('mousedown', handleResizeStart);
        itemEl.appendChild(leftHandle);

        const rightHandle = document.createElement('div');
        rightHandle.className = 'resize-handle right';
        rightHandle.addEventListener('mousedown', handleResizeStart);
        itemEl.appendChild(rightHandle);
        
        // 单击进入编辑模式
        itemEl.addEventListener('click', (e) => {
            if (itemEl.classList.contains('dragging') || itemEl.classList.contains('resizing')) return;
            if (e.target.classList.contains('delete-btn') || e.target.classList.contains('resize-handle')) return;
            makeEditable(textSpan, item.id);
        });

        // 将新元素添加到正确的泳道
        lane.appendChild(itemEl);
    } else {
        // 如果元素已存在但在错误的泳道中，移动它
        const currentLane = itemEl.closest('.lane-body-content-wrapper');
        if (currentLane !== lane) {
            console.log(`[调试] 排班条目 ${item.id} 需要移动到正确的泳道`);
            currentLane.removeChild(itemEl);
            lane.appendChild(itemEl);
        }
    }
    
    // --- 更新元素样式和内容 ---
    
    // 更新类型样式
    itemEl.classList.toggle('item-break', item.type === 'break');
    itemEl.classList.toggle('item-work', item.type !== 'break');

    // 解析时间并计算位置
    try {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        
        // 计算持续时间（小时）
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // 计算开始时间（小时）
        const startHour = start.getHours() + start.getMinutes() / 60;
        
        // 计算相对于时间轴起点的位置（像素）
        const left = (startHour - timelineStart) * PIXELS_PER_HOUR;
        
        // 计算宽度（像素）
        const width = durationHours * PIXELS_PER_HOUR;
        
        console.log(`[调试] 排班条目 ${item.id} 位置计算: 
            开始时间=${start.toLocaleTimeString()}, 
            结束时间=${end.toLocaleTimeString()}, 
            持续时间=${durationHours}小时, 
            开始小时=${startHour}, 
            时间轴起点=${timelineStart}, 
            左偏移=${left}px, 
            宽度=${width}px`);
        
        // 应用样式
        itemEl.style.left = `${left}px`;
        itemEl.style.width = `${width}px`;
        
        // 处理跨天的情况（如果开始时间在时间轴左侧）
        if (left < 0) {
            console.log(`[警告] 排班条目 ${item.id} 开始时间在时间轴外（左侧）`);
            itemEl.style.left = '0px';
            itemEl.style.width = `${width + left}px`; // 减少宽度
            itemEl.classList.add('truncated-left');
        } else {
            itemEl.classList.remove('truncated-left');
        }
        
        // 处理超出时间轴右侧的情况
        const timelineWidth = (timelineEndHour - timelineStart) * PIXELS_PER_HOUR;
        if (left + width > timelineWidth) {
            console.log(`[警告] 排班条目 ${item.id} 结束时间在时间轴外（右侧）`);
            itemEl.style.width = `${timelineWidth - left}px`;
            itemEl.classList.add('truncated-right');
        } else {
            itemEl.classList.remove('truncated-right');
        }
    } catch (error) {
        console.error(`[错误] 计算排班条目 ${item.id} 位置时出错:`, error);
        // 设置默认位置，避免完全不可见
        itemEl.style.left = '0px';
        itemEl.style.width = '100px';
        itemEl.classList.add('error');
    }

    // 更新文本内容
    const textSpan = itemEl.querySelector('.item-text');
    if (textSpan) {
        textSpan.textContent = item.task_description || '未命名任务';
    }
    
    // 添加数据属性，便于调试
    itemEl.dataset.startTime = item.start_time;
    itemEl.dataset.endTime = item.end_time;
} 