// pages/scheduling/ui.js
import { getState } from './state.js';

// --- DOM Element Cache ---
let elements = {}; // 改为空对象，稍后初始化

// 新增：获取正确的文档对象
function getDocument() {
    // 如果当前窗口是iframe，并且能够访问父窗口
    if (window.parent !== window) {
        try {
            // 检查是否可以访问父窗口的document
            if (window.parent.document) {
                console.log('在iframe中运行，尝试使用父窗口的document');
                return window.parent.document;
            }
        } catch (e) {
            console.error('无法访问父窗口的document:', e);
        }
    }
    return document;
}

// 新增初始化函数
export function initElements() {
    console.log('初始化UI元素...');
    
    // 获取正确的文档对象
    const doc = getDocument();
    
    elements = {
        teamSelector: doc.getElementById('team-selector'),
        timelineHeader: doc.getElementById('timeline-header'),
        timelineLanes: doc.getElementById('timeline-lanes'),
        syncStatus: doc.getElementById('sync-status'),
        contextMenu: doc.getElementById('timeline-context-menu'),
        // ... other elements will be added here
    };
    
    // 检查关键元素是否存在
    const missingElements = [];
    if (!elements.teamSelector) missingElements.push('team-selector');
    if (!elements.timelineHeader) missingElements.push('timeline-header');
    if (!elements.timelineLanes) missingElements.push('timeline-lanes');
    if (!elements.syncStatus) missingElements.push('sync-status');
    if (!elements.contextMenu) missingElements.push('timeline-context-menu');
    
    if (missingElements.length > 0) {
        console.error(`无法找到以下UI元素: ${missingElements.join(', ')}`);
        console.log('尝试在当前文档中查找元素...');
        
        // 如果在父窗口中找不到元素，尝试在当前文档中查找
        if (doc !== document) {
            elements = {
                teamSelector: document.getElementById('team-selector') || elements.teamSelector,
                timelineHeader: document.getElementById('timeline-header') || elements.timelineHeader,
                timelineLanes: document.getElementById('timeline-lanes') || elements.timelineLanes,
                syncStatus: document.getElementById('sync-status') || elements.syncStatus,
                contextMenu: document.getElementById('timeline-context-menu') || elements.contextMenu,
            };
        }
    }
    
    console.log('UI元素初始化完成:', elements);
    return elements;
}

// --- Toast Notification ---
export function showMesg(message, duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

// --- Team Selector ---
export function renderTeamSelector(teams, selectedTeamId) {
    elements.teamSelector.innerHTML = '';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        option.selected = team.id == selectedTeamId;
        elements.teamSelector.appendChild(option);
    });
}

// --- Timeline Rendering ---
export function renderTimeline() {
    const { currentTeams, selectedTeamId, timelineStartHour, timelineEndHour } = getState();
    if (!selectedTeamId) {
        elements.timelineLanes.innerHTML = '<p>请先选择一个团队。</p>';
        return;
    }
    const selectedTeam = currentTeams.find(t => t.id == selectedTeamId);
    if (selectedTeam) {
        generateTimeLanes(selectedTeam.members, timelineStartHour, timelineEndHour);
    }
}

function generateTimeLanes(members, start, end) {
    elements.timelineLanes.innerHTML = '';
    const { currentUser } = getState();
    
    // Ensure current user is always first
    const sortedMembers = [...members].sort((a, b) => {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
        return a.full_name.localeCompare(b.full_name);
    });

    sortedMembers.forEach(member => {
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.dataset.userId = member.id;

        const laneHeader = document.createElement('div');
        laneHeader.className = 'lane-header';
        laneHeader.textContent = member.id === currentUser.id ? "我的排班" : member.full_name;
        
        const laneBody = document.createElement('div');
        laneBody.className = 'lane-body';

        lane.appendChild(laneHeader);
        lane.appendChild(laneBody);
        elements.timelineLanes.appendChild(lane);
    });

    generateTimeTicks(start, end, elements.timelineLanes.offsetWidth);
}

function generateTimeTicks(start, end, width) {
    elements.timelineHeader.innerHTML = '';
    const { pixelsPerHour } = getState();
    const totalHours = end > start ? end - start : (24 - start) + end;
    
    elements.timelineHeader.style.width = `${totalHours * pixelsPerHour}px`;

    // 创建一个包含所有刻度的容器
    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'ticks-container';
    ticksContainer.style.width = `${totalHours * pixelsPerHour}px`;
    
    // 生成小时刻度和半小时刻度
    for (let i = 0; i < totalHours; i++) {
        const hourValue = (start + i) % 24;
        
        // 创建整点刻度
        const hourTick = document.createElement('div');
        hourTick.className = 'time-tick hour-tick';
        hourTick.style.width = `${pixelsPerHour}px`;
        hourTick.textContent = `${hourValue}:00`;
        
        // 如果是0点，添加日期分隔线样式
        if (hourValue === 0) {
            hourTick.classList.add('day-separator');
        }
        
        // 创建半小时刻度（位于整点刻度内部）
        const halfHourMark = document.createElement('div');
        halfHourMark.className = 'half-hour-mark';
        halfHourMark.style.left = `${pixelsPerHour / 2}px`;
        halfHourMark.setAttribute('data-time', `${hourValue}:30`);
        
        hourTick.appendChild(halfHourMark);
        ticksContainer.appendChild(hourTick);
    }
    
    elements.timelineHeader.appendChild(ticksContainer);
}

// --- Schedule Item Rendering ---
export function renderAllScheduleItems(schedules) {
    // Clear existing items
    document.querySelectorAll('.schedule-item').forEach(item => item.remove());
    
    // 过滤掉已删除的项目，不显示它们
    // 使用window.isItemDeleted函数，该函数在main.js中定义
    const filteredSchedules = schedules.filter(item => {
        // 如果window.isItemDeleted可用就使用它，否则使用本地判断
        if (typeof window.isItemDeleted === 'function') {
            return !window.isItemDeleted(item);
        } else {
            // 本地判断逻辑作为备用
            const isDeleted = item.is_deleted || 
                            (item.deleted_at && item.deleted_at.length > 0) || 
                            (item.task_description && item.task_description.includes('[已删除]'));
            return !isDeleted;
        }
    });
    
    console.log(`过滤前排班项目数量: ${schedules.length}, 过滤后: ${filteredSchedules.length}`);
    
    // 只渲染未删除的项目
    filteredSchedules.forEach(item => renderOrUpdateItem(item));
}

export function renderOrUpdateItem(item) {
    if (!item) {
        console.warn('尝试渲染空的排班项目');
        return;
    }
    
    const { timelineStartHour, currentUser } = getState();
    
    // 处理用户ID，考虑"current_user"的特殊情况
    let targetUserId = item.user_id;
    if (currentUser && item.user_id === currentUser.id) {
        console.log(`排班项目属于当前用户 ${currentUser.id}，尝试查找"current_user"泳道`);
        // 尝试查找特定用户ID的泳道，如果找不到则尝试查找"current_user"泳道
        const specificLaneBody = document.querySelector(`.lane[data-user-id="${item.user_id}"] .lane-body`);
        if (!specificLaneBody) {
            console.log(`找不到用户ID为 ${item.user_id} 的泳道，尝试使用"current_user"泳道`);
            targetUserId = "current_user";
        }
    }
    
    // 尝试查找泳道
    let laneBody = document.querySelector(`.lane[data-user-id="${targetUserId}"] .lane-body`);
    
    // 如果找不到，尝试在iframe中查找
    if (!laneBody && window.parent !== window) {
        try {
            console.log(`在当前文档中找不到泳道，尝试在父窗口中查找用户ID为 ${targetUserId} 的泳道`);
            laneBody = window.parent.document.querySelector(`.lane[data-user-id="${targetUserId}"] .lane-body`);
        } catch (e) {
            console.error(`尝试在父窗口中查找泳道时出错:`, e);
        }
    }
    
    // 如果仍然找不到，尝试获取第一个可用的泳道
    if (!laneBody) {
        console.warn(`找不到用户ID为 ${targetUserId} 的泳道，尝试使用第一个可用的泳道`);
        laneBody = document.querySelector('.lane-body');
        
        // 如果还是找不到，尝试在父窗口中查找
        if (!laneBody && window.parent !== window) {
            try {
                laneBody = window.parent.document.querySelector('.lane-body');
            } catch (e) {
                console.error(`尝试在父窗口中查找任意泳道时出错:`, e);
            }
        }
    }
    
    if (!laneBody) {
        console.error(`无法找到任何泳道来渲染排班项目:`, item);
        return;
    }

    console.log(`找到泳道:`, laneBody);

    // 查找现有项目或创建新项目
    let itemEl = document.getElementById(`schedule-item-${item.id}`);
    
    // 如果在当前文档中找不到，尝试在父窗口中查找
    if (!itemEl && window.parent !== window) {
        try {
            itemEl = window.parent.document.getElementById(`schedule-item-${item.id}`);
        } catch (e) {
            console.error(`尝试在父窗口中查找排班项目元素时出错:`, e);
        }
    }
    
    // 如果仍然找不到，创建新元素
    if (!itemEl) {
        // 确定应该在哪个文档中创建元素
        const targetDoc = laneBody.ownerDocument || document;
        itemEl = targetDoc.createElement('div');
        itemEl.id = `schedule-item-${item.id}`;
        itemEl.className = 'schedule-item';
        laneBody.appendChild(itemEl);
        console.log(`创建新的排班项目元素，ID=${item.id}`);
    } else {
        console.log(`更新现有排班项目元素，ID=${item.id}`);
    }

    const startDate = new Date(item.start_time);
    const endDate = new Date(item.end_time);
    
    let startHour = startDate.getHours() + startDate.getMinutes() / 60;
    let endHour = endDate.getHours() + endDate.getMinutes() / 60;

    // Adjust for overnight schedules
    if (endDate.getDate() > startDate.getDate()) {
        endHour += 24 * (endDate.getDate() - startDate.getDate());
    }

    const left = (startHour - timelineStartHour) * getState().pixelsPerHour;
    const width = (endHour - startHour) * getState().pixelsPerHour;

    itemEl.style.left = `${left}px`;
    itemEl.style.width = `${width}px`;
    
    // 检查是否是已删除的项目
    const isDeleted = item.is_deleted || 
                     (item.deleted_at && item.deleted_at.length > 0) || 
                     (item.task_description && item.task_description.includes('[已删除]'));
    
    // 确定项目类型
    let type;
    if (isDeleted) {
        type = 'deleted';
    } else if (item.task_description && item.task_description.toLowerCase().includes('休息')) {
        type = 'break';
    } else {
        type = 'work';
    }
    
    // 设置数据属性
    itemEl.dataset.type = type;
    itemEl.dataset.itemId = item.id;
    
    // 添加对应的CSS类名
    itemEl.classList.remove('item-work', 'item-break', 'item-deleted'); // 先移除所有类型类名
    
    // 确保添加了正确的类名
    if (type === 'work') {
        itemEl.classList.add('item-work');
    } else if (type === 'break') {
        itemEl.classList.add('item-break');
    } else if (type === 'deleted') {
        itemEl.classList.add('item-deleted');
    }
    
    // 如果是已删除的项目，添加特殊样式
    if (isDeleted) {
        itemEl.style.opacity = '0.5';
        itemEl.style.textDecoration = 'line-through';
    } else {
        itemEl.style.opacity = '1';
        itemEl.style.textDecoration = 'none';
    }
    
    // 设置内容
    itemEl.innerHTML = `
        <span class="item-text">${item.task_description || '新排班'}</span>
        <div class="resize-handle left"></div>
        <div class="resize-handle right"></div>
    `;
    
    // 确保可拖动
    itemEl.setAttribute('draggable', 'false'); // 防止HTML5拖放干扰自定义拖动
    
    // 添加数据属性，方便交互操作
    itemEl.dataset.startTime = item.start_time;
    itemEl.dataset.endTime = item.end_time;
    
    // 添加调试日志
    console.log(`渲染排班项目: ID=${item.id}, 类型=${type}, 位置=${left}px, 宽度=${width}px, 是否已删除=${isDeleted}, CSS类名=${itemEl.className}`);
    
    // 确保元素可见
    itemEl.style.display = 'flex';
    itemEl.style.zIndex = '10';
}

export function removeItemFromDom(itemId) {
    console.log(`尝试从DOM中移除排班项目，ID=${itemId}`);
    
    // 尝试在当前文档中查找排班项目
    let itemEl = document.getElementById(`schedule-item-${itemId}`);
    
    // 如果在当前文档中找不到，尝试在父窗口中查找
    if (!itemEl && window.parent !== window) {
        try {
            console.log('在当前文档中找不到排班项目，尝试在父窗口中查找');
            itemEl = window.parent.document.getElementById(`schedule-item-${itemId}`);
        } catch (e) {
            console.error(`尝试在父窗口中查找排班项目时出错:`, e);
        }
    }
    
    if (itemEl) {
        console.log(`找到排班项目元素，准备移除:`, itemEl);
        itemEl.remove();
        console.log(`已从DOM中移除排班项目，ID=${itemId}`);
    } else {
        console.warn(`找不到要移除的排班项目元素，ID=${itemId}`);
    }
}

// --- Context Menu ---
export function showContextMenu(e) {
    e.preventDefault();
    
    // 确保elements.contextMenu存在
    if (!elements.contextMenu) {
        console.error('上下文菜单元素未初始化！');
        
        // 尝试在父窗口中查找
        if (window.parent !== window) {
            try {
                const parentContextMenu = window.parent.document.getElementById('timeline-context-menu');
                if (parentContextMenu) {
                    console.log('在父窗口中找到上下文菜单元素');
                    elements.contextMenu = parentContextMenu;
                }
            } catch (e) {
                console.error('尝试在父窗口中查找上下文菜单元素时出错:', e);
                return;
            }
        }
        
        if (!elements.contextMenu) {
            return;
        }
    }
    
    const { contextMenu, timelineHeader, timelineLanes } = elements;

    // First, hide all actions and separators
    contextMenu.querySelectorAll('li').forEach(li => li.style.display = 'none');

    const target = e.target;
    
    // 添加调试信息
    console.log('右键点击目标:', target);
    
    // 确定点击的上下文
    let isInHeader = false;
    let isInLanes = false;
    
    // 检查是否在timelineHeader中
    if (timelineHeader) {
        isInHeader = timelineHeader.contains(target);
    }
    
    // 如果不在timelineHeader中，检查是否在timelineLanes中
    if (!isInHeader && timelineLanes) {
        isInLanes = timelineLanes.contains(target);
    }
    
    // 如果在iframe中，还需要检查父窗口中的元素
    if ((!isInHeader && !isInLanes) && window.parent !== window) {
        try {
            const parentTimelineHeader = window.parent.document.getElementById('timeline-header');
            const parentTimelineLanes = window.parent.document.getElementById('timeline-lanes');
            
            if (parentTimelineHeader && parentTimelineHeader.contains(target)) {
                isInHeader = true;
                console.log('在父窗口的时间轴头部右键');
            } else if (parentTimelineLanes && parentTimelineLanes.contains(target)) {
                isInLanes = true;
                console.log('在父窗口的泳道区域右键');
            }
        } catch (e) {
            console.error('尝试在父窗口中检查元素时出错:', e);
        }
    }
    
    // 根据上下文显示不同的菜单项
    if (isInHeader) {
        console.log('在时间轴头部右键');
        contextMenu.querySelectorAll('.ctx-header-action').forEach(li => li.style.display = 'block');
    } else if (isInLanes) {
        console.log('在泳道区域右键');
        
        // 尝试在当前文档中查找排班项目
        let item = target.closest('.schedule-item');
        
        // 如果在当前文档中找不到，尝试在父窗口中查找
        if (!item && window.parent !== window) {
            try {
                item = target.closest('.schedule-item', window.parent.document);
                if (item) {
                    console.log('在父窗口中找到排班项目');
                }
            } catch (e) {
                console.error('尝试在父窗口中查找排班项目时出错:', e);
            }
        }
        
        if (item) {
            // Click is on a specific schedule item
            console.log('在排班项目上右键');
            contextMenu.querySelectorAll('.ctx-item-action').forEach(li => li.style.display = 'block');
            
            // 存储当前点击的排班项目ID，方便删除操作使用
            if (item.dataset && item.dataset.itemId) {
                window.currentClickedItemId = item.dataset.itemId;
                console.log('已存储当前点击的排班项目ID:', window.currentClickedItemId);
            } else {
                console.warn('排班项目元素没有itemId数据属性:', item);
            }
        } else {
            // 尝试在父窗口中查找排班项目
            if (window.parent !== window) {
                try {
                    const parentItem = target.closest('.schedule-item', window.parent.document);
                    if (parentItem) {
                        console.log('在父窗口中找到排班项目');
                        contextMenu.querySelectorAll('.ctx-item-action').forEach(li => li.style.display = 'block');
                        
                        // 存储当前点击的排班项目ID
                        if (parentItem.dataset && parentItem.dataset.itemId) {
                            window.currentClickedItemId = parentItem.dataset.itemId;
                            console.log('已存储来自父窗口的排班项目ID:', window.currentClickedItemId);
                        } else {
                            console.warn('父窗口中的排班项目元素没有itemId数据属性:', parentItem);
                        }
                        return;
                    }
                } catch (e) {
                    console.error('尝试在父窗口中查找排班项目时出错:', e);
                }
            }
            
            // 如果找不到排班项目，尝试根据点击位置查找最近的排班项目
            if (window.lastContextMenuInfo && window.lastContextMenuInfo.clientX && window.lastContextMenuInfo.clientY) {
                console.log('尝试根据点击位置查找最近的排班项目');
                
                // 在当前文档中查找所有排班项目
                const allItems = document.querySelectorAll('.schedule-item');
                if (allItems.length > 0) {
                    console.log(`在当前文档中找到 ${allItems.length} 个排班项目`);
                    
                    // 查找最近的排班项目
                    let closestItem = null;
                    let closestDistance = Infinity;
                    const x = window.lastContextMenuInfo.clientX;
                    const y = window.lastContextMenuInfo.clientY;
                    
                    allItems.forEach(item => {
                        const itemRect = item.getBoundingClientRect();
                        const itemX = itemRect.left + itemRect.width / 2;
                        const itemY = itemRect.top + itemRect.height / 2;
                        const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2));
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestItem = item;
                        }
                    });
                    
                    if (closestItem && closestDistance < 100) { // 只有在距离小于100px时才考虑
                        console.log(`找到最近的排班项目，距离=${closestDistance.toFixed(2)}px:`, closestItem);
                        contextMenu.querySelectorAll('.ctx-item-action').forEach(li => li.style.display = 'block');
                        
                        // 存储当前点击的排班项目ID
                        if (closestItem.dataset && closestItem.dataset.itemId) {
                            window.currentClickedItemId = closestItem.dataset.itemId;
                            console.log('已存储最近的排班项目ID:', window.currentClickedItemId);
                        } else {
                            console.warn('最近的排班项目元素没有itemId数据属性:', closestItem);
                        }
                        return;
                    }
                }
                
                // 如果在当前文档中找不到，尝试在父窗口中查找
                if (window.parent !== window) {
                    try {
                        const parentItems = window.parent.document.querySelectorAll('.schedule-item');
                        if (parentItems.length > 0) {
                            console.log(`在父窗口中找到 ${parentItems.length} 个排班项目`);
                            
                            // 查找最近的排班项目
                            let closestItem = null;
                            let closestDistance = Infinity;
                            const x = window.lastContextMenuInfo.clientX;
                            const y = window.lastContextMenuInfo.clientY;
                            
                            parentItems.forEach(item => {
                                const itemRect = item.getBoundingClientRect();
                                const itemX = itemRect.left + itemRect.width / 2;
                                const itemY = itemRect.top + itemRect.height / 2;
                                const distance = Math.sqrt(Math.pow(x - itemX, 2) + Math.pow(y - itemY, 2));
                                
                                if (distance < closestDistance) {
                                    closestDistance = distance;
                                    closestItem = item;
                                }
                            });
                            
                            if (closestItem && closestDistance < 100) { // 只有在距离小于100px时才考虑
                                console.log(`在父窗口中找到最近的排班项目，距离=${closestDistance.toFixed(2)}px:`, closestItem);
                                contextMenu.querySelectorAll('.ctx-item-action').forEach(li => li.style.display = 'block');
                                
                                // 存储当前点击的排班项目ID
                                if (closestItem.dataset && closestItem.dataset.itemId) {
                                    window.currentClickedItemId = closestItem.dataset.itemId;
                                    console.log('已存储来自父窗口的最近排班项目ID:', window.currentClickedItemId);
                                } else {
                                    console.warn('父窗口中的最近排班项目元素没有itemId数据属性:', closestItem);
                                }
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('尝试在父窗口中查找最近的排班项目时出错:', e);
                    }
                }
            }
            
            // Click is on the empty space of a lane
            console.log('在泳道空白处右键');
            contextMenu.querySelectorAll('.ctx-lane-action').forEach(li => li.style.display = 'block');
        }
    } else {
        // Click is outside any specific area, do not show the menu
        console.log('在不相关区域右键，不显示菜单');
        hideContextMenu();
        return; // Exit early
    }

    // If we are showing the menu, position and display it
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    // 确保菜单可见
    contextMenu.style.opacity = '1';
    contextMenu.style.transform = 'scale(1)';
    
    // 添加可见类（如果CSS中有定义）
    contextMenu.classList.add('visible');
}

export function hideContextMenu() {
    // 获取上下文菜单元素
    let contextMenu = elements.contextMenu;
    
    // 如果在当前文档中找不到，尝试在父窗口中查找
    if (!contextMenu && window.parent !== window) {
        try {
            contextMenu = window.parent.document.getElementById('timeline-context-menu');
        } catch (e) {
            console.error('尝试在父窗口中查找上下文菜单元素时出错:', e);
        }
    }
    
    if (!contextMenu) return;
    
    if (contextMenu.style.display === 'block') {
        contextMenu.style.display = 'none';
        contextMenu.style.opacity = '0';
        contextMenu.style.transform = 'scale(0.95)';
        contextMenu.classList.remove('visible');
    }
}

export function updateSyncStatus(status) {
    if (!elements.syncStatus) return;

    const statusConfig = {
        connecting: { 
            text: '连接中...', 
            class: 'initializing',
            icon: '🔄'
        },
        subscribed: { 
            text: '已连接', 
            class: 'subscribed',
            icon: '✅'
        },
        error: { 
            text: '连接错误', 
            class: 'error',
            icon: '❌'
        },
        closed: { 
            text: '连接关闭', 
            class: 'closed',
            icon: '⚠️'
        },
        reconnecting: { 
            text: '重新连接中...', 
            class: 'reconnecting',
            icon: '🔄'
        },
        syncing: { 
            text: '同步中...', 
            class: 'syncing',
            icon: '🔄'
        },
        synced: { 
            text: '已同步', 
            class: 'synced',
            icon: '✓'
        }
    };

    const config = statusConfig[status] || { text: '未知状态', class: 'error', icon: '❓' };
    
    // 更新状态显示
    elements.syncStatus.innerHTML = `<span class="sync-icon">${config.icon}</span> ${config.text}`;
    elements.syncStatus.className = `sync-status ${config.class}`;
    
    // 如果是临时状态（如synced），3秒后自动恢复到subscribed状态
    if (status === 'synced') {
        setTimeout(() => {
            updateSyncStatus('subscribed');
        }, 3000);
    }
    
    // 记录状态变化到控制台
    console.log(`[同步状态] ${status}: ${config.text}`);
} 