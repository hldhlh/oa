import { getState } from './data-handler.js';

// --- 模块常量 ---

// 岗位到Tailwind颜色类的映射 (与schedule-board.js保持一致)
const POSITION_COLORS = {
    '前厅': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    '后厨': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    '洗碗间': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    'default': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

// --- DOM 元素引用 ---
const employeeListEl = document.getElementById('employee-list');
const restingEmployeeListEl = document.getElementById('resting-employee-list');

/**
 * 渲染"团队成员"和"今日休息"两个列表
 * @param {string} dateString - "YYYY-MM-DD"
 */
export function renderEmployeeLists(dateString) {
    const { employees, schedule } = getState();
    const scheduleForDate = schedule[dateString] || [];
    const scheduledEmployeeIds = new Set(scheduleForDate.map(s => s.employeeId));

    // 清空现有列表
    employeeListEl.innerHTML = '';
    restingEmployeeListEl.innerHTML = '';

    employees.forEach(employee => {
        // --- 渲染团队成员列表 (所有员工) ---
        const colors = POSITION_COLORS[employee.position] || POSITION_COLORS.default;
        const employeeDiv = document.createElement('div');
        employeeDiv.className = `p-2 rounded cursor-move border ${colors.bg} ${colors.text} ${colors.border}`;
        employeeDiv.textContent = `${employee.name} (${employee.position})`;
        
        // 为拖拽功能做准备
        employeeDiv.draggable = true;
        employeeDiv.dataset.employeeId = employee.id;
        
        employeeDiv.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', JSON.stringify(employee));
            event.dataTransfer.effectAllowed = 'copy';
        });
        
        employeeListEl.appendChild(employeeDiv);

        // --- 渲染今日休息列表 ---
        if (!scheduledEmployeeIds.has(employee.id)) {
            const restingDiv = document.createElement('div');
            restingDiv.textContent = employee.name;
            restingEmployeeListEl.appendChild(restingDiv);
        }
    });
} 