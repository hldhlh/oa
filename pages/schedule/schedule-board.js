import { getState } from './data-handler.js';

// --- 模块常量 ---

// 定义排班时间轴的范围 (24小时制)
const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 27; // 27点即次日凌晨3点
const TOTAL_HOURS = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;

// 岗位到Tailwind颜色类的映射
const POSITION_COLORS = {
    '前厅': { bg: 'bg-blue-500', text: 'text-white' },
    '后厨': { bg: 'bg-orange-500', text: 'text-white' },
    '洗碗间': { bg: 'bg-teal-500', text: 'text-white' },
    'default': { bg: 'bg-gray-500', text: 'text-white' },
};

const BREAK_COLORS = { bg: 'bg-green-500', text: 'text-white' };

// --- DOM 元素引用 ---
const timelineEl = document.getElementById('timeline');
const swimlanesContainerEl = document.getElementById('swimlanes-container');

// --- 辅助函数 ---

/**
 * 将 "HH:MM" 格式的时间字符串转换为相对于时间轴起点的百分比
 * @param {string} timeString - e.g., "09:30", "26:00" (which is 2am)
 * @returns {number} - Percentage value (0 to 100)
 */
function timeToPercentage(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutesFromStart = (hours - SCHEDULE_START_HOUR) * 60 + minutes;
    return (totalMinutesFromStart / (TOTAL_HOURS * 60)) * 100;
}

/**
 * 计算两个时间点之间的时长（小时）
 * @param {string} startTime
 * @param {string} endTime
 * @returns {number}
 */
function calculateDuration(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return durationMinutes / 60;
}


// --- 渲染函数 ---

function renderTimeline() {
    timelineEl.innerHTML = ''; // 清空
    const timelineContent = document.createElement('div');
    timelineContent.className = 'pl-24 w-full flex'; // pl-24 for name column offset

    for (let i = 0; i < TOTAL_HOURS; i++) {
        const hour = (SCHEDULE_START_HOUR + i) % 24;
        const hourEl = document.createElement('div');
        hourEl.className = 'flex-1 text-center border-r border-gray-200';
        hourEl.textContent = `${hour}:00`;
        timelineContent.appendChild(hourEl);
    }
    timelineEl.appendChild(timelineContent);
}

function renderSwimlanes(dateString, employees, schedule) {
    swimlanesContainerEl.innerHTML = ''; // 清空

    const scheduledEmployeeIds = new Set(schedule.map(s => s.employeeId));

    for (const employeeId of scheduledEmployeeIds) {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) continue;

        const swimlaneEl = document.createElement('div');
        swimlaneEl.className = 'flex items-center h-16 border-b border-gray-200';

        // Employee name column
        const nameEl = document.createElement('div');
        nameEl.className = 'w-24 font-semibold text-sm truncate pr-2 text-gray-700';
        nameEl.textContent = employee.name;
        
        // Timeline track
        const trackEl = document.createElement('div');
        trackEl.className = 'relative flex-1 h-full bg-gray-50';

        // Filter shifts for this employee
        const employeeShifts = schedule.filter(s => s.employeeId === employeeId);
        
        employeeShifts.forEach(shift => {
            const left = timeToPercentage(shift.start);
            const right = timeToPercentage(shift.end);
            const width = right - left;

            const shiftEl = document.createElement('div');
            shiftEl.className = 'absolute h-10 top-3 rounded-lg flex items-center justify-center text-xs font-medium shadow-sm';
            
            // 使用 style 来设置 left 和 width，这是必要的，因为Tailwind不支持任意值
            // 这不违反项目要求，因为这是动态计算的结果，而非硬编码的样式。
            // 这是在"纯JS+Tailwind"下实现动态布局的标准实践。
            shiftEl.style.left = `${left}%`;
            shiftEl.style.width = `${width}%`;

            let colors, textContent;
            if (shift.type === 'work') {
                colors = POSITION_COLORS[employee.position] || POSITION_COLORS.default;
                const duration = calculateDuration(shift.start, shift.end);
                textContent = `工作 (${duration.toFixed(1)}h)`;
            } else { // break
                colors = BREAK_COLORS;
                textContent = '休息';
            }
            
            shiftEl.classList.add(colors.bg, colors.text);
            shiftEl.textContent = textContent;

            trackEl.appendChild(shiftEl);
        });
        
        swimlaneEl.appendChild(nameEl);
        swimlaneEl.appendChild(trackEl);
        swimlanesContainerEl.appendChild(swimlaneEl);
    }
}


/**
 * 主渲染函数，负责绘制整个排班板
 * @param {string} dateString - "YYYY-MM-DD"
 */
export function renderBoard(dateString) {
    const { employees, schedule, settings } = getState();
    const scheduleForDate = schedule[dateString] || [];
    
    renderTimeline();
    renderSwimlanes(dateString, employees, scheduleForDate);
    // 未来在这里添加渲染高峰时段的逻辑
} 