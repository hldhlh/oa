// pages/schedule/index.js

import { renderBoard, renderWeeklyBoard } from './schedule-board.js';
import { renderEmployeeLists, initEmployeeManager } from './employee-manager.js';

// 全局状态或配置
const state = {
    // 当前显示的日期，未来可以扩展为可选择的
    currentDate: new Date(),
    currentView: 'day' // 新增视图状态
};

// --- 辅助函数 ---
/**
 * 格式化日期为 "YYYY-MM-DD"
 * @param {Date} date
 * @returns {string}
 */
function getFormattedDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为 "YYYY年MM月DD日 星期X"
 * @param {Date} date
 * @returns {string}
 */
function getDisplayDateString(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
}

/**
 * 更新HTML中的日期显示
 */
function updateDateDisplay() {
    document.getElementById('current-date-display').textContent = getDisplayDateString(state.currentDate);
}

/**
 * 导航日期
 * @param {number} offset - 日期偏移量，例如 -1 为前一天，1 为后一天
 */
function navigateDate(offset) {
    const newDate = new Date(state.currentDate);
    newDate.setDate(newDate.getDate() + offset);
    state.currentDate = newDate;
    refreshUI();
}

/**
 * 设置并渲染视图
 * @param {'day' | 'week'} viewType - 视图类型
 */
function setAndRenderView(viewType) {
    state.currentView = viewType;
    refreshUI();
}

// --- 主要UI逻辑 ---

/**
 * 应用的"刷新"函数，重新渲染所有动态部分
 * 任何数据更新后，都应调用此函数来同步UI
 */
function refreshUI() {
    const dateString = getFormattedDateString(state.currentDate);
    console.log(`Refreshing UI for date: ${dateString}, view: ${state.currentView}`);

    const dayViewContainer = document.getElementById('schedule-board');
    const weekViewContainer = document.getElementById('weekly-schedule-board');

    if (state.currentView === 'day') {
        dayViewContainer.classList.remove('hidden');
        weekViewContainer.classList.add('hidden');
        renderBoard(dateString);
        renderEmployeeLists(dateString);
    } else if (state.currentView === 'week') {
        dayViewContainer.classList.add('hidden');
        weekViewContainer.classList.remove('hidden');
        renderWeeklyBoard(state.currentDate); // 周视图传入Date对象方便计算
        // 周视图下员工列表可能无需更新，或以不同方式更新
    }
    updateDateDisplay(); // 更新日期显示
    updateViewButtons(); // 更新视图按钮状态
}

/**
 * 更新视图切换按钮的选中状态
 */
function updateViewButtons() {
    const dayBtn = document.getElementById('day-view-btn');
    const weekBtn = document.getElementById('week-view-btn');

    if (state.currentView === 'day') {
        dayBtn.classList.add('bg-gray-200', 'text-indigo-700');
        weekBtn.classList.remove('bg-gray-200', 'text-indigo-700');
    } else {
        dayBtn.classList.remove('bg-gray-200', 'text-indigo-700');
        weekBtn.classList.add('bg-gray-200', 'text-indigo-700');
    }
}

/**
 * 应用初始化函数
 */
function initialize() {
    // 初始化员工管理器，并传入刷新UI的回调
    initEmployeeManager(refreshUI);

    // 监听自定义的"数据已更新"事件
    // 当 data-handler 或其他模块修改数据并希望通知UI刷新时，可以派发此事件
    document.addEventListener('state-updated', refreshUI);
    
    // 添加日期导航按钮事件监听器
    document.getElementById('prev-day-btn')?.addEventListener('click', () => navigateDate(-1));
    document.getElementById('next-day-btn')?.addEventListener('click', () => navigateDate(1));

    // 添加视图切换按钮事件监听器
    document.getElementById('day-view-btn')?.addEventListener('click', () => setAndRenderView('day'));
    document.getElementById('week-view-btn')?.addEventListener('click', () => setAndRenderView('week'));

    // 首次加载时，进行初始渲染
    refreshUI();

    console.log('Restaurant schedule app initialized.');
}

// 启动应用
initialize(); 