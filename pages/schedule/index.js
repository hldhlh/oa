// pages/schedule/index.js

import { renderBoard } from './schedule-board.js';
import { renderEmployeeLists } from './employee-manager.js';

// 全局状态或配置
const state = {
    // 当前显示的日期，未来可以扩展为可选择的
    currentDate: '2024-07-29' 
};

/**
 * 应用的"刷新"函数，重新渲染所有动态部分
 * 任何数据更新后，都应调用此函数来同步UI
 */
function refreshUI() {
    console.log(`Refreshing UI for date: ${state.currentDate}`);
    renderBoard(state.currentDate);
    renderEmployeeLists(state.currentDate);
}

/**
 * 应用初始化函数
 */
function initialize() {
    // 监听自定义的"数据已更新"事件
    // 当 data-handler 或其他模块修改数据并希望通知UI刷新时，可以派发此事件
    document.addEventListener('state-updated', refreshUI);
    
    // 首次加载时，进行初始渲染
    refreshUI();

    console.log('Restaurant schedule app initialized.');
}

// 启动应用
initialize(); 