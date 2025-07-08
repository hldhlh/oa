// pages/scheduling/main.js
// This will be the main entry point, coordinating all other modules.

import * as api from './api.js';
import * as ui from './ui.js';
import { getState, setState, subscribe } from './state.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("New modular script loaded!");
    
    // 检查是否在iframe中运行
    const isInIframe = window.parent !== window;
    console.log(`当前脚本运行环境: ${isInIframe ? 'iframe' : '主窗口'}`);

    // 初始化UI元素
    ui.initElements();

    // 1. Initial Setup
    const user = await api.getUser();
    if (!user) {
        ui.showMesg('请先登录！');
        if (isInIframe) {
            window.parent.location.href = '/index.html'; // Redirect parent frame
        } else {
            window.location.href = '/index.html'; // Redirect current window
        }
        return;
    }

    const teams = await api.getTeams();
    const lastSelectedTeamId = localStorage.getItem('selectedTeamId');
    const initialState = {
        currentUser: user,
        currentTeams: teams,
        selectedTeamId: lastSelectedTeamId && teams.some(t => t.id == lastSelectedTeamId) 
                        ? parseInt(lastSelectedTeamId, 10) 
                        : (teams[0]?.id || null)
    };
    setState(initialState);
    
    // 2. Initial Render
    ui.renderTeamSelector(teams, getState().selectedTeamId);
    ui.renderTimeline();
    
    // 3. Load initial data and subscribe
    await loadSchedulesAndSubscribe();

    // 4. Setup Event Listeners
    let lastContextMenuEvent = null; // Single source of truth for the context event

    // 获取正确的文档对象
    const doc = isInIframe ? window.parent.document : document;
    
    // 获取team-selector元素
    const teamSelector = doc.getElementById('team-selector') || document.getElementById('team-selector');
    if (teamSelector) {
        teamSelector.addEventListener('change', handleTeamChange);
    } else {
        console.error('找不到team-selector元素，无法添加事件监听器');
    }

    // Context Menu Listeners - REFACTORED
    // Use a single listener on the container for robustness
    const timelineContainer = doc.getElementById('timeline-container') || document.getElementById('timeline-container');
    if (timelineContainer) {
        timelineContainer.addEventListener('contextmenu', (e) => {
            console.log('捕获到右键点击事件:', e);
            
            // 存储必要的信息而非整个事件对象
            window.lastContextMenuInfo = {
                clientX: e.clientX,
                clientY: e.clientY,
                target: e.target,
                timestamp: Date.now()
            };
            
            // 尝试立即找到并存储排班项目ID
            try {
                const item = e.target.closest('.schedule-item');
                if (item && item.dataset && item.dataset.itemId) {
                    window.currentClickedItemId = item.dataset.itemId;
                    console.log('在contextmenu事件中直接存储排班项目ID:', window.currentClickedItemId);
                }
            } catch (error) {
                console.error('尝试在contextmenu事件中存储排班项目ID时出错:', error);
            }
            
            ui.showContextMenu(e);
        });
    } else {
        console.error('找不到timeline-container元素，无法添加右键菜单事件监听器');
    }
    
    // 在当前文档和父窗口文档上都添加点击事件监听器
    document.addEventListener('click', ui.hideContextMenu);
    if (isInIframe) {
        try {
            window.parent.document.addEventListener('click', ui.hideContextMenu);
        } catch (e) {
            console.error('无法在父窗口添加点击事件监听器:', e);
        }
    }

    // Context Menu Actions - 在当前文档和父窗口文档上都尝试添加事件监听器
    const addEventListenerToElement = (id, eventType, handler) => {
        const element = doc.getElementById(id) || document.getElementById(id);
        if (element) {
            element.addEventListener(eventType, handler);
            console.log(`成功为元素 ${id} 添加 ${eventType} 事件监听器`);
        } else {
            console.error(`找不到元素 ${id}，无法添加事件监听器`);
        }
    };
    
    addEventListenerToElement('ctx-add-work-at-time', 'click', () => handleBulkAddItem('work'));
    addEventListenerToElement('ctx-add-break-at-time', 'click', () => handleBulkAddItem('break'));
    addEventListenerToElement('ctx-add-work', 'click', () => handleAddItem('work'));
    addEventListenerToElement('ctx-add-break', 'click', () => handleAddItem('break'));
    addEventListenerToElement('ctx-delete-item', 'click', handleDeleteItem);
    
    // 添加缺失的事件监听器
    addEventListenerToElement('ctx-edit-item', 'click', handleEditItem);
    addEventListenerToElement('ctx-change-to-work', 'click', () => console.log('转为工作班次功能尚未实现'));
    addEventListenerToElement('ctx-change-to-break', 'click', () => console.log('转为休息时间功能尚未实现'));

    // 处理编辑项目功能
    async function handleEditItem() {
        // 获取当前点击的排班项目ID
        const itemId = window.currentClickedItemId;
        if (!itemId) {
            console.error('没有存储的排班项目ID，无法编辑');
            ui.showMesg('无法找到要编辑的排班项目');
            return;
        }
        
        // 查找排班项目元素
        const itemEl = doc.getElementById(`schedule-item-${itemId}`) || 
                      document.getElementById(`schedule-item-${itemId}`);
        
        if (!itemEl) {
            console.error(`找不到排班项目元素，ID=${itemId}`);
            ui.showMesg('找不到要编辑的排班项目');
            return;
        }
        
        // 查找文本元素
        const itemText = itemEl.querySelector('.item-text');
        if (itemText) {
            // 如果setupInteractionEvents已经运行，使用其中定义的makeEditable函数
            if (typeof window.makeEditable === 'function') {
                window.makeEditable(itemText, itemId);
            } else {
                // 临时实现编辑功能
                const originalText = itemText.textContent;
                const newText = prompt('请输入新的排班描述:', originalText);
                
                if (newText !== null && newText !== originalText) {
                    try {
                        ui.updateSyncStatus('syncing');
                        
                        // 调用API更新描述
                        const result = await api.updateScheduleTask(itemId, newText);
                        
                        if (result) {
                            // 更新状态
                            const currentSchedules = getState().schedules || [];
                            setState({
                                schedules: currentSchedules.map(schedule => 
                                    schedule.id === parseInt(itemId) ? result : schedule
                                )
                            });
                            
                            ui.showMesg('描述已更新！');
                            ui.updateSyncStatus('synced');
                        } else {
                            throw new Error('更新描述失败');
                        }
                    } catch (e) {
                        console.error('保存描述更改失败:', e);
                        ui.showMesg('保存描述失败！');
                        ui.updateSyncStatus('error');
                    }
                }
            }
        }
    }

    // Subscribe to state changes to re-render UI
    subscribe(state => {
        // This is a simple re-render strategy. Could be optimized later.
        ui.renderTimeline();
        ui.renderAllScheduleItems(state.schedules);
    });
    
    // 设置window全局变量，方便调试
    window.lastContextMenuEvent = lastContextMenuEvent; // 直接存储事件对象，而不是函数
    window.getState = getState;
    window.setState = setState;
    window.isItemDeleted = isItemDeleted; // 导出isItemDeleted函数
    
    // 添加拖动和调整大小的事件监听器
    setupInteractionEvents();
});

// 检查项目是否已删除的函数
function isItemDeleted(item) {
    return item.is_deleted || 
           (item.deleted_at && item.deleted_at.length > 0) || 
           (item.task_description && item.task_description.includes('[已删除]'));
}

async function loadSchedulesAndSubscribe() {
    const { selectedTeamId } = getState();
    if (!selectedTeamId) {
        console.warn("No team selected, cannot load schedules.");
        return;
    }

    // Fetch initial data
    const initialSchedules = await api.getSchedules(selectedTeamId);
    
    // 过滤掉已删除的项目
    const filteredSchedules = initialSchedules.filter(item => !isItemDeleted(item));
    
    console.log(`加载排班：过滤前数量: ${initialSchedules.length}, 过滤后: ${filteredSchedules.length}`);
    
    // 只保存未删除的项目到状态中
    setState({ schedules: filteredSchedules });
    ui.renderAllScheduleItems(filteredSchedules);

    // Subscribe to realtime changes
    api.subscribeToScheduleChanges(selectedTeamId, handleRealtimeEvent, ui.updateSyncStatus);
}

async function handleTeamChange(e) {
    const teamId = parseInt(e.target.value, 10);
    localStorage.setItem('selectedTeamId', teamId);
    setState({ selectedTeamId: teamId });
    await loadSchedulesAndSubscribe();
}

function handleRealtimeEvent(payload) {
    console.log("Handling realtime event:", payload);
    const { eventType, new: newRecord, old: oldRecord, table } = payload;
    let currentSchedules = getState().schedules;

    switch (eventType) {
        case 'INSERT':
            // 只添加未删除的新项目
            if (newRecord && !isItemDeleted(newRecord)) {
                setState({ schedules: [...currentSchedules, newRecord] });
            }
            break;
        case 'UPDATE':
            // 如果项目被标记为删除，则从状态中移除
            if (newRecord && isItemDeleted(newRecord)) {
                console.log('项目被标记为删除，从状态中移除:', newRecord.id);
                setState({
                    schedules: currentSchedules.filter(item => item.id !== newRecord.id)
                });
            } else if (newRecord) {
                // 否则更新项目
                setState({
                    schedules: currentSchedules.map(item => item.id === newRecord.id ? newRecord : item)
                });
            }
            break;
        case 'DELETE':
            // 从状态中移除已删除的项目
            if (oldRecord) {
                setState({
                    schedules: currentSchedules.filter(item => item.id !== oldRecord.id)
                });
            }
            break;
        default:
            console.log("Unhandled event type:", eventType);
    }
}

// 新增：将时间四舍五入到最近的刻度
function roundToNearestTimeSlot(hour, snapMinutes = 30) {
    // 将小时转换为分钟
    const totalMinutes = hour * 60;
    // 四舍五入到最近的snapMinutes分钟
    const roundedMinutes = Math.round(totalMinutes / snapMinutes) * snapMinutes;
    // 转回小时表示
    return roundedMinutes / 60;
}

async function handleAddItem(type) {
    if (!lastContextMenuEvent) {
        console.error('没有上下文菜单事件，无法添加排班项目');
        return;
    }
    
    const { timelineStartHour, pixelsPerHour, snapMinutes, currentUser } = getState();
    
    // 获取泳道元素
    let laneBody = lastContextMenuEvent.target.closest('.lane-body');
    
    // 如果在当前文档中找不到，尝试在父窗口中查找
    if (!laneBody && window.parent !== window) {
        try {
            laneBody = lastContextMenuEvent.target.closest('.lane-body', window.parent.document);
        } catch (e) {
            console.error('尝试在父窗口中查找泳道元素时出错:', e);
        }
    }
    
    if (!laneBody) {
        console.error('找不到泳道主体元素，无法添加排班项目');
        return;
    }
    
    // 获取用户ID
    let userId = laneBody.parentElement.dataset.userId;
    
    // 如果用户ID是"current_user"，使用当前登录用户的ID
    if (userId === "current_user" && currentUser) {
        userId = currentUser.id;
        console.log(`将"current_user"映射到实际用户ID: ${userId}`);
    }
    
    console.log(`准备为用户ID=${userId}添加${type}类型的排班项目`);
    
    const rect = laneBody.getBoundingClientRect();
    const clickX = lastContextMenuEvent.clientX - rect.left;
    
    // 计算点击位置对应的小时
    const rawStartHour = timelineStartHour + (clickX / pixelsPerHour);
    // 四舍五入到最近的时间刻度
    const startHour = roundToNearestTimeSlot(rawStartHour, snapMinutes);
    const endHour = startHour + 1; // Default 1 hour duration
    
    console.log(`计算的时间: 原始=${rawStartHour.toFixed(2)}小时, 四舍五入=${startHour.toFixed(2)}小时, 结束=${endHour.toFixed(2)}小时`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startTime = new Date(today.getTime() + startHour * 3600 * 1000);
    const endTime = new Date(today.getTime() + endHour * 3600 * 1000);
    
    console.log(`开始时间: ${startTime.toLocaleTimeString()}, 结束时间: ${endTime.toLocaleTimeString()}`);

    const newItem = {
        user_id: userId,
        team_id: getState().selectedTeamId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        task_description: type === 'work' ? '新工作班次' : '休息时间'
    };
    
    console.log('准备创建排班项目:', newItem);

    try {
        // 更新同步状态为"同步中"
        ui.updateSyncStatus('syncing');
        
        const createdItem = await api.createSchedule(newItem);
        console.log('成功创建排班项目:', createdItem);
        
        // 主动更新UI，不仅依赖实时订阅
        if (createdItem) {
            const currentSchedules = getState().schedules || [];
            setState({ schedules: [...currentSchedules, createdItem] });
            console.log('已更新状态，当前排班数量:', currentSchedules.length + 1);
            
            // 直接调用渲染函数，确保立即显示
            ui.renderOrUpdateItem(createdItem);
        } else {
            console.error('创建排班项目成功，但返回数据为空');
        }
        
        ui.showMesg('班次已添加！');
        // 更新同步状态为"已同步"
        ui.updateSyncStatus('synced');
    } catch (e) {
        ui.showMesg('添加失败！');
        console.error('添加班次失败:', e);
        // 更新同步状态为"错误"
        ui.updateSyncStatus('error');
        
        // 添加重试功能
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '重试';
        retryBtn.className = 'retry-btn';
        retryBtn.onclick = () => handleAddItem(type);
        
        const toast = document.querySelector('.toast-notification');
        if (toast) {
            toast.appendChild(retryBtn);
        }
    }
}

async function handleDeleteItem() {
    console.log('开始执行删除排班项目函数');
    
    // 首先检查是否有存储的排班项目ID
    let itemId = window.currentClickedItemId;
    if (itemId) {
        console.log(`使用存储的排班项目ID: ${itemId}`);
    } else {
        console.log('没有存储的排班项目ID，尝试从DOM中查找');
        
        // 尝试找到被点击的排班项目
        let itemEl = null;
        
        // 使用存储的上下文菜单信息
        const contextMenuInfo = window.lastContextMenuInfo;
        if (contextMenuInfo && contextMenuInfo.target) {
            try {
                // 尝试使用target.closest方法
                itemEl = contextMenuInfo.target.closest('.schedule-item');
                console.log('使用contextMenuInfo.target.closest方法查找排班项目:', itemEl);
            } catch (e) {
                console.error('使用contextMenuInfo.target.closest方法查找排班项目时出错:', e);
            }
        } else {
            console.warn('没有有效的上下文菜单信息或target属性');
        }
        
        // 如果在当前文档中找不到，尝试在当前文档中查找所有排班项目
        if (!itemEl) {
            console.log('尝试在当前文档中查找所有排班项目');
            const allItems = document.querySelectorAll('.schedule-item');
            console.log(`在当前文档中找到 ${allItems.length} 个排班项目`);
            
            if (allItems.length === 1) {
                itemEl = allItems[0];
                console.log('在当前文档中只有一个排班项目，使用它:', itemEl);
            }
        }
        
        // 如果在当前文档中找不到，尝试在父窗口中查找
        if (!itemEl && window.parent !== window) {
            try {
                console.log('在当前文档中找不到排班项目，尝试在父窗口中查找');
                
                // 获取父窗口中的所有排班项目
                const parentItems = window.parent.document.querySelectorAll('.schedule-item');
                console.log(`在父窗口中找到 ${parentItems.length} 个排班项目`);
                
                // 如果只有一个排班项目被选中（通过右键菜单），那么就使用它
                if (parentItems.length === 1) {
                    itemEl = parentItems[0];
                    console.log('在父窗口中只有一个排班项目，使用它:', itemEl);
                } else if (parentItems.length > 1 && contextMenuInfo && contextMenuInfo.clientX && contextMenuInfo.clientY) {
                    // 尝试查找最近的排班项目
                    const doc = window.parent.document;
                    const x = contextMenuInfo.clientX;
                    const y = contextMenuInfo.clientY;
                    
                    // 创建一个临时元素在点击位置
                    const tempEl = doc.createElement('div');
                    tempEl.style.position = 'absolute';
                    tempEl.style.left = `${x}px`;
                    tempEl.style.top = `${y}px`;
                    tempEl.style.width = '1px';
                    tempEl.style.height = '1px';
                    tempEl.style.pointerEvents = 'none';
                    doc.body.appendChild(tempEl);
                    
                    // 查找最近的排班项目
                    let closestItem = null;
                    let closestDistance = Infinity;
                    
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
                    
                    // 移除临时元素
                    doc.body.removeChild(tempEl);
                    
                    if (closestItem) {
                        itemEl = closestItem;
                        console.log(`在父窗口中找到最近的排班项目，距离=${closestDistance.toFixed(2)}px:`, itemEl);
                    }
                }
            } catch (e) {
                console.error('尝试在父窗口中查找排班项目时出错:', e);
            }
        }
        
        // 如果仍然找不到，尝试从状态中获取第一个排班项目
        if (!itemEl) {
            console.log('尝试从状态中获取第一个排班项目');
            const schedules = getState().schedules;
            if (schedules && schedules.length > 0) {
                itemId = schedules[0].id;
                console.log(`从状态中获取到第一个排班项目ID: ${itemId}`);
            }
        } else {
            // 从找到的元素中获取ID
            itemId = itemEl.dataset.itemId;
            if (!itemId) {
                console.error('排班项目元素没有itemId数据属性:', itemEl);
                ui.showMesg('排班项目缺少ID信息，无法删除');
                return;
            }
        }
        
        // 最终检查
        if (!itemId) {
            console.error('找不到要删除的排班项目元素');
            ui.showMesg('无法找到要删除的排班项目');
            return;
        }
    }
    
    console.log(`准备删除排班项目，ID=${itemId}`);
    
    if (confirm('确定要删除这个排班吗？')) {
        try {
            ui.updateSyncStatus('syncing');
            console.log(`开始删除排班项目，ID=${itemId}`);
            
            const result = await api.deleteSchedule(itemId);
            console.log(`删除排班项目结果:`, result);
            
            // 根据删除方法处理结果
            if (result.success) {
                const currentSchedules = getState().schedules || [];
                
                if (result.method === 'hard_delete') {
                    // 硬删除：从状态中移除项目
                    setState({ 
                        schedules: currentSchedules.filter(item => item.id !== parseInt(itemId, 10)) 
                    });
                    
                    // 从DOM中移除项目
                    ui.removeItemFromDom(itemId);
                    
                    ui.showMesg('班次已删除！');
                } else {
                    // 软删除或标记为删除：更新项目状态
                    if (result.data && result.data.length > 0) {
                        const updatedItem = result.data[0];
                        
                        // 更新状态
                        setState({
                            schedules: currentSchedules.map(item => 
                                item.id === updatedItem.id ? updatedItem : item
                            )
                        });
                        
                        // 更新UI
                        ui.renderOrUpdateItem(updatedItem);
                        
                        ui.showMesg('班次已标记为删除！');
                    } else {
                        // 如果没有返回数据，尝试从DOM中移除项目
                        ui.removeItemFromDom(itemId);
                        setState({ 
                            schedules: currentSchedules.filter(item => item.id !== parseInt(itemId, 10)) 
                        });
                        ui.showMesg('班次已删除！');
                    }
                }
                
                ui.updateSyncStatus('synced');
                
                // 清除存储的排班项目ID
                window.currentClickedItemId = null;
            } else {
                throw new Error('删除操作未返回成功状态');
            }
        } catch (e) {
            console.error(`删除排班项目失败，ID=${itemId}:`, e);
            ui.showMesg(`删除失败！${e.message || ''}`);
            ui.updateSyncStatus('error');
            
            // 添加重试功能
            const retryBtn = document.createElement('button');
            retryBtn.textContent = '重试';
            retryBtn.className = 'retry-btn';
            retryBtn.onclick = handleDeleteItem;
            
            const toast = document.querySelector('.toast-notification');
            if (toast) {
                toast.appendChild(retryBtn);
            }
        }
    }
}

async function handleBulkAddItem(type) {
    if (!lastContextMenuEvent) {
        console.error('没有上下文菜单事件，无法批量添加排班项目');
        return;
    }
    const state = getState();
    if (!state.selectedTeamId) {
        console.error('没有选择团队，无法批量添加排班项目');
        return;
    }

    const selectedTeam = state.currentTeams.find(t => t.id === state.selectedTeamId);
    if (!selectedTeam || !selectedTeam.members) {
        console.error('找不到选定的团队或团队成员为空');
        return;
    }
    
    console.log(`准备为团队"${selectedTeam.name}"的${selectedTeam.members.length}名成员批量添加${type}类型的排班项目`);

    // 获取时间轴头部元素
    let header = document.getElementById('timeline-header');
    
    // 如果在当前文档中找不到，尝试在父窗口中查找
    if (!header && window.parent !== window) {
        try {
            header = window.parent.document.getElementById('timeline-header');
        } catch (e) {
            console.error('尝试在父窗口中查找时间轴头部元素时出错:', e);
        }
    }
    
    if (!header) {
        console.error('找不到时间轴头部元素，无法批量添加排班项目');
        return;
    }
    
    const rect = header.getBoundingClientRect();
    const clickX = lastContextMenuEvent.clientX - rect.left;
    
    // 计算点击位置对应的小时
    const rawStartHour = state.timelineStartHour + (clickX / state.pixelsPerHour);
    // 四舍五入到最近的时间刻度
    const startHour = roundToNearestTimeSlot(rawStartHour, state.snapMinutes);
    const endHour = startHour + 1; // Default 1 hour duration
    
    console.log(`计算的时间: 原始=${rawStartHour.toFixed(2)}小时, 四舍五入=${startHour.toFixed(2)}小时, 结束=${endHour.toFixed(2)}小时`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startTime = new Date(today.getTime() + startHour * 3600 * 1000);
    const endTime = new Date(today.getTime() + endHour * 3600 * 1000);
    const taskDescription = type === 'work' ? '新工作班次' : '休息时间';
    
    console.log(`开始时间: ${startTime.toLocaleTimeString()}, 结束时间: ${endTime.toLocaleTimeString()}`);

    const newItems = selectedTeam.members.map(member => ({
        user_id: member.id,
        team_id: state.selectedTeamId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        task_description: taskDescription
    }));
    
    console.log(`准备批量创建${newItems.length}个排班项目:`, newItems);

    try {
        // 更新同步状态为"同步中"
        ui.updateSyncStatus('syncing');
        
        const createdItems = await api.createBulkSchedules(newItems);
        console.log(`成功批量创建${createdItems ? createdItems.length : 0}个排班项目:`, createdItems);
        
        // 主动更新UI，不仅依赖实时订阅
        if (createdItems && createdItems.length > 0) {
            const currentSchedules = getState().schedules || [];
            setState({ schedules: [...currentSchedules, ...createdItems] });
            console.log('已更新状态，当前排班数量:', currentSchedules.length + createdItems.length);
            
            // 直接调用渲染函数，确保立即显示
            createdItems.forEach(item => ui.renderOrUpdateItem(item));
        } else {
            console.error('批量创建排班项目成功，但返回数据为空或长度为0');
        }
        
        ui.showMesg(`已为所有成员批量添加 ${taskDescription}！`);
        // 更新同步状态为"已同步"
        ui.updateSyncStatus('synced');
    } catch (e) {
        ui.showMesg('批量添加失败！');
        console.error('批量添加班次失败:', e);
        // 更新同步状态为"错误"
        ui.updateSyncStatus('error');
        
        // 添加重试功能
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '重试';
        retryBtn.className = 'retry-btn';
        retryBtn.onclick = () => handleBulkAddItem(type);
        
        const toast = document.querySelector('.toast-notification');
        if (toast) {
            toast.appendChild(retryBtn);
        }
    }
}

/*
// --- TODO: MIGRATE INTERACTION LOGIC ---

// The following logic for drag-to-move, resize, and inline editing
// needs to be migrated from the old script.js into this new modular structure.
// It will involve adding event listeners in main.js and creating handler
// functions that call api.js and update state.

// --- DRAG AND RESIZE LOGIC (from old script.js) ---

function handleResizeStart(e) {
    // ...
}
function handleDragStart(e) {
    // ...
}

// --- INLINE EDIT LOGIC (from old script.js) ---
function makeEditable(textSpan, itemId) {
    // ...
}

*/ 

// --- 拖动、调整大小和编辑功能 ---

// 在DOMContentLoaded事件中添加事件监听器
document.addEventListener('DOMContentLoaded', async () => {
    // ... 现有代码 ...
    
    // 设置window全局变量，方便调试
    window.lastContextMenuEvent = lastContextMenuEvent; // 直接存储事件对象，而不是函数
    window.getState = getState;
    window.setState = setState;
    window.isItemDeleted = isItemDeleted; // 导出isItemDeleted函数
    
    // 添加拖动和调整大小的事件监听器
    setupInteractionEvents();
});

// 设置交互事件
function setupInteractionEvents() {
    console.log('设置排班项目交互事件...');
    
    // 获取正确的文档对象
    const doc = window.parent !== window ? window.parent.document : document;
    
    // 使用事件委托，在容器上监听事件
    const timelineContainer = doc.getElementById('timeline-container') || document.getElementById('timeline-container');
    if (!timelineContainer) {
        console.error('找不到timeline-container元素，无法添加交互事件');
        return;
    }
    
    // 存储拖动和调整大小的状态
    let dragState = {
        isDragging: false,
        isResizing: false,
        currentItem: null,
        initialX: 0,
        initialY: 0, // 新增：记录初始Y坐标
        initialLeft: 0,
        initialWidth: 0,
        resizeDirection: null,
        initialTime: null,
        laneElement: null,
        originalUserId: null
    };
    
    // 鼠标按下事件 - 开始拖动或调整大小
    timelineContainer.addEventListener('mousedown', (e) => {
        // 检查是否点击了调整大小的把手
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle) {
            handleResizeStart(e, resizeHandle);
            return;
        }
        
        // 检查是否点击了排班项目
        const scheduleItem = e.target.closest('.schedule-item');
        if (scheduleItem && !e.target.closest('.item-text')) {
            handleDragStart(e, scheduleItem);
        }
    });
    
    // 鼠标移动事件 - 拖动或调整大小
    doc.addEventListener('mousemove', (e) => {
        if (!dragState.isDragging && !dragState.isResizing) return;
        
        e.preventDefault(); // 防止选择文本
        
        const { pixelsPerHour, timelineStartHour } = getState();
        
        if (dragState.isResizing) {
            // 调整大小逻辑
            const item = dragState.currentItem;
            const deltaX = e.clientX - dragState.initialX;
            
            if (dragState.resizeDirection === 'right') {
                // 调整右侧（结束时间）
                const newWidth = Math.max(50, dragState.initialWidth + deltaX); // 最小宽度为50px
                item.style.width = `${newWidth}px`;
                
                // 更新调整中的视觉效果
                item.classList.add('resizing');
            } else if (dragState.resizeDirection === 'left') {
                // 调整左侧（开始时间）
                const newLeft = Math.min(dragState.initialLeft + deltaX, 
                                        dragState.initialLeft + dragState.initialWidth - 50); // 确保最小宽度为50px
                const newWidth = dragState.initialLeft + dragState.initialWidth - newLeft;
                
                // 更新位置和宽度
                item.style.left = `${newLeft}px`;
                item.style.width = `${newWidth}px`;
                
                // 更新调整中的视觉效果
                item.classList.add('resizing');
            }
        } else if (dragState.isDragging) {
            // 拖动逻辑
            const item = dragState.currentItem;
            const deltaX = e.clientX - dragState.initialX;
            const deltaY = e.clientY - (dragState.initialY || dragState.initialX); // 使用initialY或fallback到initialX
            
            // 获取时间刻度信息
            const { pixelsPerHour, snapMinutes } = getState();
            const snapPixels = (pixelsPerHour / 60) * snapMinutes; // 计算吸附像素值
            
            // 计算新的左侧位置，确保不会为负
            let newLeft = Math.max(0, dragState.initialLeft + deltaX);
            
            // 吸附到时间刻度
            if (snapMinutes > 0) {
                const snapPosition = Math.round(newLeft / snapPixels) * snapPixels;
                // 只有当接近吸附点时才吸附
                if (Math.abs(newLeft - snapPosition) < 10) {
                    newLeft = snapPosition;
                }
            }
            
            item.style.left = `${newLeft}px`;
            
            // 更新拖动中的视觉效果
            item.classList.add('dragging');
            
            // 检查是否拖动到了不同的泳道
            if (dragState.laneElement) {
                const lanes = doc.querySelectorAll('.lane');
                const mouseY = e.clientY;
                
                for (const lane of lanes) {
                    const rect = lane.getBoundingClientRect();
                    if (mouseY >= rect.top && mouseY <= rect.bottom) {
                        // 如果鼠标在这个泳道内
                        if (lane !== dragState.laneElement) {
                            // 移动到新泳道
                            const laneBody = lane.querySelector('.lane-body');
                            if (laneBody) {
                                laneBody.appendChild(item);
                                dragState.laneElement = lane;
                                
                                // 更新用户ID（为保存做准备）
                                dragState.newUserId = lane.dataset.userId;
                                
                                // 添加视觉提示
                                lanes.forEach(l => l.classList.remove('drag-target'));
                                lane.classList.add('drag-target');
                            }
                        }
                        break;
                    }
                }
            }
        }
    });
    
    // 鼠标松开事件 - 结束拖动或调整大小
    doc.addEventListener('mouseup', async (e) => {
        if (!dragState.isDragging && !dragState.isResizing) return;
        
        const item = dragState.currentItem;
        if (!item) {
            resetDragState();
            return;
        }
        
        try {
            const { pixelsPerHour, timelineStartHour } = getState();
            const itemId = item.dataset.itemId;
            
            if (!itemId) {
                console.error('排班项目缺少ID，无法保存更改');
                resetDragState();
                return;
            }
            
            // 更新同步状态
            ui.updateSyncStatus('syncing');
            
            if (dragState.isResizing) {
                // 保存调整大小的结果
                const newWidth = parseFloat(item.style.width);
                const newLeft = parseFloat(item.style.left);
                
                // 计算新的开始和结束时间
                const startHour = timelineStartHour + (newLeft / pixelsPerHour);
                const durationHours = newWidth / pixelsPerHour;
                const endHour = startHour + durationHours;
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const startTime = new Date(today.getTime() + startHour * 3600 * 1000);
                const endTime = new Date(today.getTime() + endHour * 3600 * 1000);
                
                console.log(`调整大小：ID=${itemId}, 新的开始时间=${startTime.toLocaleTimeString()}, 新的结束时间=${endTime.toLocaleTimeString()}`);
                
                // 调用API更新时间
                const result = await api.updateScheduleTime(
                    itemId, 
                    startTime.toISOString(), 
                    endTime.toISOString(),
                    null // 不改变所有者
                );
                
                if (result) {
                    // 更新状态
                    const currentSchedules = getState().schedules || [];
                    setState({
                        schedules: currentSchedules.map(schedule => 
                            schedule.id === parseInt(itemId) ? result : schedule
                        )
                    });
                    
                    ui.showMesg('时间已更新！');
                } else {
                    throw new Error('调整时间失败');
                }
            } else if (dragState.isDragging) {
                // 保存拖动的结果
                const newLeft = parseFloat(item.style.left);
                const startHour = timelineStartHour + (newLeft / pixelsPerHour);
                
                // 计算持续时间
                const width = parseFloat(item.style.width);
                const durationHours = width / pixelsPerHour;
                const endHour = startHour + durationHours;
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const startTime = new Date(today.getTime() + startHour * 3600 * 1000);
                const endTime = new Date(today.getTime() + endHour * 3600 * 1000);
                
                // 确定用户ID（如果发生了变化）
                const newUserId = dragState.newUserId || dragState.originalUserId;
                
                console.log(`拖动：ID=${itemId}, 新的开始时间=${startTime.toLocaleTimeString()}, 新的结束时间=${endTime.toLocaleTimeString()}, 用户ID=${newUserId}`);
                
                // 调用API更新时间和所有者
                const result = await api.updateScheduleTime(
                    itemId, 
                    startTime.toISOString(), 
                    endTime.toISOString(),
                    newUserId
                );
                
                if (result) {
                    // 更新状态
                    const currentSchedules = getState().schedules || [];
                    setState({
                        schedules: currentSchedules.map(schedule => 
                            schedule.id === parseInt(itemId) ? result : schedule
                        )
                    });
                    
                    ui.showMesg('排班已移动！');
                } else {
                    throw new Error('移动排班失败');
                }
            }
            
            // 更新同步状态
            ui.updateSyncStatus('synced');
        } catch (e) {
            console.error('保存排班更改失败:', e);
            ui.showMesg('保存更改失败！');
            ui.updateSyncStatus('error');
            
            // 重新渲染以恢复原始状态
            ui.renderAllScheduleItems(getState().schedules);
        } finally {
            // 重置拖动状态
            resetDragState();
        }
    });
    
    // 双击事件 - 编辑排班项目描述
    timelineContainer.addEventListener('dblclick', (e) => {
        const itemText = e.target.closest('.item-text');
        if (itemText) {
            const scheduleItem = itemText.closest('.schedule-item');
            if (scheduleItem) {
                const itemId = scheduleItem.dataset.itemId;
                if (itemId) {
                    makeEditable(itemText, itemId);
                }
            }
        }
    });
    
    // 右键菜单编辑事件
    const editMenuItem = doc.getElementById('ctx-edit-item') || document.getElementById('ctx-edit-item');
    if (editMenuItem) {
        editMenuItem.addEventListener('click', () => {
            // 获取当前点击的排班项目ID
            const itemId = window.currentClickedItemId;
            if (!itemId) {
                console.error('没有存储的排班项目ID，无法编辑');
                return;
            }
            
            // 查找排班项目元素
            const itemEl = doc.getElementById(`schedule-item-${itemId}`) || 
                          document.getElementById(`schedule-item-${itemId}`);
            
            if (!itemEl) {
                console.error(`找不到排班项目元素，ID=${itemId}`);
                return;
            }
            
            // 查找文本元素
            const itemText = itemEl.querySelector('.item-text');
            if (itemText) {
                makeEditable(itemText, itemId);
            }
        });
    }
    
    // 处理调整大小开始
    function handleResizeStart(e, resizeHandle) {
        e.preventDefault();
        
        const scheduleItem = resizeHandle.closest('.schedule-item');
        if (!scheduleItem) return;
        
        const direction = resizeHandle.classList.contains('right') ? 'right' : 'left';
        
        dragState = {
            isResizing: true,
            isDragging: false,
            currentItem: scheduleItem,
            initialX: e.clientX,
            initialY: e.clientY, // 记录初始Y坐标
            initialWidth: scheduleItem.offsetWidth,
            initialLeft: parseFloat(scheduleItem.style.left) || 0,
            resizeDirection: direction
        };
        
        // 添加视觉反馈
        scheduleItem.classList.add('resizing');
        
        // 防止文本选择
        doc.body.style.userSelect = 'none';
    }
    
    // 处理拖动开始
    function handleDragStart(e, scheduleItem) {
        e.preventDefault();
        
        dragState = {
            isDragging: true,
            isResizing: false,
            currentItem: scheduleItem,
            initialX: e.clientX,
            initialY: e.clientY, // 记录初始Y坐标
            initialLeft: parseFloat(scheduleItem.style.left) || 0,
            initialWidth: scheduleItem.offsetWidth,
            laneElement: scheduleItem.closest('.lane'),
            originalUserId: scheduleItem.closest('.lane')?.dataset.userId
        };
        
        // 添加视觉反馈
        scheduleItem.classList.add('dragging');
        
        // 防止文本选择
        doc.body.style.userSelect = 'none';
    }
    
    // 重置拖动状态
    function resetDragState() {
        if (dragState.currentItem) {
            dragState.currentItem.classList.remove('dragging', 'resizing');
        }
        
        // 清除所有泳道的高亮状态
        const doc = window.parent !== window ? window.parent.document : document;
        doc.querySelectorAll('.lane').forEach(lane => {
            lane.classList.remove('drag-target');
        });
        
        dragState = {
            isDragging: false,
            isResizing: false,
            currentItem: null,
            initialX: 0,
            initialY: 0, // 重置Y坐标
            initialLeft: 0,
            initialWidth: 0,
            resizeDirection: null,
            laneElement: null,
            originalUserId: null,
            newUserId: null
        };
        
        // 恢复文本选择
        document.body.style.userSelect = '';
        if (window.parent !== window) {
            try {
                window.parent.document.body.style.userSelect = '';
            } catch (e) {
                console.error('无法恢复父窗口的文本选择:', e);
            }
        }
    }
    
    // 使文本可编辑
    function makeEditable(textSpan, itemId) {
        // 保存原始文本
        const originalText = textSpan.textContent;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'edit-input';
        
        // 替换文本为输入框
        textSpan.innerHTML = '';
        textSpan.appendChild(input);
        
        // 聚焦输入框
        input.focus();
        input.select();
        
        // 处理输入框失去焦点和按下回车键
        const saveChanges = async () => {
            const newText = input.value.trim();
            
            // 恢复文本显示
            textSpan.textContent = newText || originalText;
            
            // 如果文本有变化，保存更改
            if (newText !== originalText && newText) {
                try {
                    ui.updateSyncStatus('syncing');
                    
                    // 调用API更新描述
                    const result = await api.updateScheduleTask(itemId, newText);
                    
                    if (result) {
                        // 更新状态
                        const currentSchedules = getState().schedules || [];
                        setState({
                            schedules: currentSchedules.map(schedule => 
                                schedule.id === parseInt(itemId) ? result : schedule
                            )
                        });
                        
                        ui.showMesg('描述已更新！');
                        ui.updateSyncStatus('synced');
                    } else {
                        throw new Error('更新描述失败');
                    }
                } catch (e) {
                    console.error('保存描述更改失败:', e);
                    ui.showMesg('保存描述失败！');
                    ui.updateSyncStatus('error');
                    
                    // 恢复原始文本
                    textSpan.textContent = originalText;
                }
            }
        };
        
        // 绑定事件
        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                textSpan.textContent = originalText; // 取消编辑，恢复原始文本
            }
        });
    }
    
    // 导出makeEditable函数到全局
    window.makeEditable = makeEditable;
} 