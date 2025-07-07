// Supabase and timeline logic will go here.
const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 新增：通用信息框函数 ---
function showToast(message, duration = 3000) {
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


document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showToast('请先登录！');
        return;
    }
    currentUser = user;
    
    loadSettings();
    await initializeTeamSelector();
    await initializeTimeline();
    setupEventListeners();
});

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
    
    selectedTeamId = selector.value;
    selector.addEventListener('change', (e) => {
        selectedTeamId = e.target.value;
        localStorage.setItem('selectedTeamId', selectedTeamId);
        initializeTimeline();
    });
}

async function initializeTimeline() {
    if (!selectedTeamId) {
        document.getElementById('timeline-lanes').innerHTML = '<p>请先选择一个团队。</p>';
        return;
    }
    console.log(`初始化团队 ${selectedTeamId} 的时间轴范围: ${timelineStartHour} - ${timelineEndHour}`);
    
    const selectedTeam = currentTeams.find(t => t.id == selectedTeamId);
    generateTimeLanes(selectedTeam.members, timelineStartHour, timelineEndHour);

    const { data, error } = await supabase.rpc('get_schedules_for_team', { team_id: selectedTeamId });
    
    if (error) {
        console.error('获取团队排班失败', error);
        return;
    }
    renderScheduleItems(data || [], timelineStartHour);
    syncScroll();
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
    e.stopPropagation(); // 关键：阻止事件冒泡到window，防止触发全局点击监听器

    // 在显示新菜单前，先隐藏任何可能已存在的菜单
    hideContextMenu();

    const contextMenu = document.getElementById('timeline-context-menu');
    
    // 从事件目标上找到最近的 lane-body-content-wrapper，然后是 lane
    const laneBodyWrapper = e.currentTarget;
    const lane = laneBodyWrapper.closest('.lane');
    if (!lane) return; // 如果找不到lane，则不显示菜单

    const startHour = calculateHourFromClick(e);
    const targetUserId = lane.dataset.userId;

    // 存储数据到菜单
    contextMenu.dataset.userId = targetUserId;
    contextMenu.dataset.startHour = startHour;

    // 定位并显示菜单
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.display = 'block'; // 先设为block，才能获取尺寸
    contextMenu.classList.add('visible');

    // 为菜单项绑定事件
    const addItemBtn = document.getElementById('add-schedule-item-ctx');
    addItemBtn.onclick = () => {
        handleCreateNewItemFromContext();
        hideContextMenu();
    };
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
    const snapGridPixels = 25; // 15分钟 = 25px
    const startPixel = Math.floor(clickX / snapGridPixels) * snapGridPixels;
    return (startPixel / PIXELS_PER_HOUR) + timelineStartHour;
}

async function createScheduleItemAt(userId, startHour) {
    if (!userId || isNaN(startHour)) return;

    const today = new Date();
    const startTime = new Date(today.setHours(0, 0, 0, 0) + startHour * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 默认1小时

    const newItem = {
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        task_description: '新任务'
    };

    await createScheduleInDb(newItem);
}

async function handleCreateNewItemFromContext() {
    const contextMenu = document.getElementById('timeline-context-menu');
    const targetUserId = contextMenu.dataset.userId;
    const startHour = parseFloat(contextMenu.dataset.startHour);
    await createScheduleItemAt(targetUserId, startHour);
}

async function createScheduleInDb(newItem) {
    console.log('正在创建新排班...');
    const { data, error } = await supabase
        .from('schedules')
        .insert(newItem) // 修正：直接使用传入的newItem，它已包含正确的user_id
        .select()
        .single();

    if (error) {
        console.error('创建排班失败:', error);
        showToast('创建失败，请稍后重试。');
    } else {
        console.log('创建成功:', data);
        currentScheduleData.push(data);
        renderScheduleItems(currentScheduleData, timelineStartHour); // 重新渲染以显示新条目
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
        showToast('无法验证用户信息，请重新登录。');
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
                <span>${member.email}</span>
            </div>
            <div class="lane-body">
                <div class="lane-body-content-wrapper" style="width: ${timelineWidth}px;"></div>
            </div>
        `;
        timelineLanesContainer.appendChild(lane);

        // 为每个泳道的背景绑定右键菜单和双击事件
        const laneBodyWrapper = lane.querySelector('.lane-body-content-wrapper');
        laneBodyWrapper.addEventListener('contextmenu', showContextMenu);
        laneBodyWrapper.addEventListener('dblclick', handleCreateNewItem);
    });
}

function generateTimeTicks(start, end, width) {
    const timelineHeader = document.getElementById('timeline-header');
    timelineHeader.innerHTML = '';
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
    // 先清空所有泳道
    document.querySelectorAll('.lane-body-content-wrapper').forEach(w => w.innerHTML = '');

    items.forEach(item => {
        const laneBody = document.querySelector(`.lane[data-user-id="${item.user_id}"] .lane-body-content-wrapper`);
        if (!laneBody) return; // 如果找不到对应用户的泳道，则跳过

        const itemElement = document.createElement('div');
        itemElement.className = 'schedule-item';
        itemElement.textContent = item.task_description;
        itemElement.dataset.itemId = item.id; // 存储ID以便后续更新

        const startTime = new Date(item.start_time);
        const endTime = new Date(item.end_time);

        // 使用毫秒数差来精确计算跨天时长
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        
        // 关键改动：位置相对于时间轴起点
        const left = (startHour - timelineStart) * PIXELS_PER_HOUR;
        const width = durationHours * PIXELS_PER_HOUR;

        if (itemElement.contains(document.activeElement)) return;
        
        // 只渲染在可视范围内的条目 (可以加一个 buffer)
        if (endHour > timelineStart && startHour < timelineEndHour) {
            itemElement.style.left = `${left}px`;
            itemElement.style.width = `${width}px`;

            // 创建删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;'; // "X" 符号
            deleteBtn.addEventListener('click', handleDeleteItem);
            itemElement.appendChild(deleteBtn);

            // 创建可编辑的文本区域
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            textSpan.textContent = item.task_description;
            itemElement.appendChild(textSpan);

            // 单击进入编辑模式
            itemElement.addEventListener('click', (e) => {
                // 防止拖拽时触发编辑
                if (itemElement.classList.contains('dragging') || itemElement.classList.contains('resizing')) return;
                // 防止点击删除按钮或把手时触发
                if (e.target.classList.contains('delete-btn') || e.target.classList.contains('resize-handle')) return;
                
                makeEditable(textSpan, item.id);
            });
            
            // 创建调整大小的把手
            const leftHandle = document.createElement('div');
            leftHandle.className = 'resize-handle left';
            itemElement.appendChild(leftHandle);

            const rightHandle = document.createElement('div');
            rightHandle.className = 'resize-handle right';
            itemElement.appendChild(rightHandle);

            // 为拖拽和调整大小添加事件监听器
            itemElement.addEventListener('mousedown', handleDragStart);
            leftHandle.addEventListener('mousedown', handleResizeStart);
            rightHandle.addEventListener('mousedown', handleResizeStart);

            laneBody.appendChild(itemElement);
        }
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
    
    const { error } = await supabase
        .from('schedules')
        .update({ task_description: newTask })
        .eq('id', id);

    if (error) {
        console.error('更新任务描述失败:', error);
        showToast('更新任务描述失败，请稍后重试。');
    } else {
        console.log('任务描述更新成功。');
        const itemIndex = currentScheduleData.findIndex(item => item.id == id);
        if (itemIndex !== -1) {
            currentScheduleData[itemIndex].task_description = newTask;
        }
    }
}

async function handleDeleteItem(e) {
    e.stopPropagation(); // 防止触发父元素的其他事件

    if (!confirm('确定要删除这个排班吗？')) {
        return;
    }

    const itemElement = e.currentTarget.parentElement;
    const itemId = itemElement.dataset.itemId;

    console.log(`正在删除 ID: ${itemId} 的排班...`);

    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('删除失败:', error);
        showToast('删除失败，请稍后重试。');
    } else {
        console.log('删除成功。');
        // 从UI和缓存中移除
        itemElement.remove();
        currentScheduleData = currentScheduleData.filter(item => item.id != itemId);
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
    const minWidth = 25; // 最小宽度为15分钟

    function handleResizeMove(e) {
        const deltaX = e.clientX - startX;
        const snapGridPixels = 25;

        if (handleSide === 'right') {
            let newWidth = initialWidth + deltaX;
            newWidth = Math.round(newWidth / snapGridPixels) * snapGridPixels;
            newWidth = Math.max(minWidth, newWidth);
            itemElement.style.width = `${newWidth}px`;
        } else { // left handle
            let newLeft = initialLeft + deltaX;
            let newWidth = initialWidth - deltaX;

            // 吸附
            const snappedDelta = Math.round(deltaX / snapGridPixels) * snapGridPixels;
            newLeft = initialLeft + snappedDelta;
            newWidth = initialWidth - snappedDelta;

            if (newWidth >= minWidth) {
                itemElement.style.left = `${newLeft}px`;
                itemElement.style.width = `${newWidth}px`;
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

        const itemId = itemElement.dataset.itemId;
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
        const pixelsPerMinute = 100 / 60; // 100px 每小时
        const snapIntervalMinutes = 15;
        const snapGridPixels = pixelsPerMinute * snapIntervalMinutes; // 15分钟对应的像素数

        // 计算最接近的吸附点
        newLeft = Math.round(newLeft / snapGridPixels) * snapGridPixels;

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

        const itemId = itemElement.dataset.itemId;
        
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
        showToast('请输入有效的起止时间 (0-48)，且开始时间必须小于结束时间。');
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
    // 使用 '==' 是为了处理字符串和数字ID的比较
    return currentScheduleData.find(item => item.id == id);
}

async function updateScheduleTime(id, newStartTime, newEndTime, newOwnerId) {
    console.log(`正在更新 ID: ${id} 的时间为 ${newStartTime} 到 ${newEndTime}`);
    
    const updateObject = {
        start_time: newStartTime,
        end_time: newEndTime,
    };

    if (newOwnerId) {
        updateObject.user_id = newOwnerId;
        console.log(`...并将其所有者更改为 ${newOwnerId}`);
    }
    
    const { data, error } = await supabase
        .from('schedules')
        .update(updateObject)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('更新排班失败:', error);
        showToast('更新失败，请刷新页面后重试。');
    } else {
        console.log('更新成功:', data);
        const itemIndex = currentScheduleData.findIndex(item => item.id == id);
        if (itemIndex !== -1) {
            currentScheduleData[itemIndex].start_time = newStartTime;
            currentScheduleData[itemIndex].end_time = newEndTime;
            if (newOwnerId) {
                // 如果所有者已更改，最佳做法是完全重新获取和渲染数据
                // 以确保UI正确反映新的所有权（条目移动到新泳道）。
                // 为了简单起见，我们在这里只更新本地缓存并重新渲染。
                currentScheduleData[itemIndex].user_id = newOwnerId;
                renderScheduleItems(currentScheduleData, timelineStartHour);
            }
        }
    }
} 