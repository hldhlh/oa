/**
 * 这是一个专门用于处理应用所有数据和本地存储的模块。
 * 它封装了数据的读取、写入、修改以及与localStorage的同步逻辑。
 * 所有其他模块需要数据时，都应该通过本模块提供的接口进行，而不是直接操作state或localStorage。
 */

// 默认的初始状态，当localStorage中没有数据时使用
const defaultState = {
    employees: [
        { id: 1, name: '张三', position: '前厅', type: '全职' },
        { id: 2, name: '李四', position: '后厨', type: '全职' },
        { id: 3, name: '王五', position: '前厅', type: '兼职' },
        { id: 4, name: '赵六', position: '洗碗间', type: '兼职' },
    ],
    // 排班数据以 "YYYY-MM-DD" 为键
    schedule: {
        '2024-07-29': [
            { id: 101, employeeId: 1, start: '10:00', end: '15:00', type: 'work' },
            { id: 102, employeeId: 1, start: '12:00', end: '12:30', type: 'break' },
            { id: 103, employeeId: 2, start: '11:00', end: '19:00', type: 'work' },
        ]
    },
    // 应用的其他设置
    settings: {
        peakHours: []
    }
};

// 应用的全局状态
let state;

/**
 * 将当前状态保存到localStorage
 */
function saveState() {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('restaurantScheduleState', serializedState);
    } catch (e) {
        console.error("Could not save state to localStorage", e);
    }
}

/**
 * 从localStorage加载状态
 * 如果localStorage中没有，则使用默认状态
 */
export function loadState() {
    try {
        const serializedState = localStorage.getItem('restaurantScheduleState');
        if (serializedState === null) {
            state = JSON.parse(JSON.stringify(defaultState)); // Deep copy to avoid mutation
        } else {
            state = JSON.parse(serializedState);
        }
    } catch (e) {
        console.error("Could not load state from localStorage, using default state.", e);
        state = JSON.parse(JSON.stringify(defaultState));
    }
}

/**
 * 获取当前状态的只读副本
 * @returns {object} The current state
 */
export function getState() {
    // 返回深拷贝以防止外部直接修改
    return JSON.parse(JSON.stringify(state));
}

/**
 * 获取所有员工列表
 * @returns {Array}
 */
export function getEmployees() {
    return state.employees;
}

/**
 * 获取指定日期的排班表
 * @param {string} dateString - "YYYY-MM-DD"
 * @returns {Array}
 */
export function getScheduleForDate(dateString) {
    return state.schedule[dateString] || [];
}

/**
 * 添加一个新员工
 * @param {object} employeeData - { name, position, type }
 * @returns {object} The newly created employee object
 */
export function addEmployee(employeeData) {
    const newEmployee = {
        id: Date.now(), // 使用时间戳作为简单唯一ID
        ...employeeData,
    };
    state.employees.push(newEmployee);
    saveState();
    return newEmployee;
}

/**
 * 根据ID删除一个员工
 * 同时也会删除该员工在所有日期的排班记录
 * @param {number} employeeId
 */
export function deleteEmployee(employeeId) {
    // 1. 从员工列表中删除员工
    state.employees = state.employees.filter(emp => emp.id !== employeeId);

    // 2. 遍历整个排班表，删除该员工的所有班次
    for (const date in state.schedule) {
        state.schedule[date] = state.schedule[date].filter(shift => shift.employeeId !== employeeId);
    }
    
    saveState();
}

/**
 * 重新排列员工的顺序
 * @param {number} draggedEmployeeId - 被拖动的员工ID
 * @param {number | null} targetEmployeeId - 拖放目标位置的员工ID, 如果为null则移动到末尾
 */
export function reorderEmployees(draggedEmployeeId, targetEmployeeId) {
    const employees = state.employees;
    const draggedIndex = employees.findIndex(e => e.id === draggedEmployeeId);

    if (draggedIndex === -1) {
        console.error("Dragged employee not found");
        return;
    }

    // 从数组中移除被拖动的员工
    const [draggedEmployee] = employees.splice(draggedIndex, 1);

    // 如果目标ID为null，则移动到数组末尾
    if (targetEmployeeId === null) {
        employees.push(draggedEmployee);
    } else {
        // 否则，找到目标员工的索引并在其之前插入
        const targetIndex = employees.findIndex(e => e.id === targetEmployeeId);
        if (targetIndex !== -1) {
            employees.splice(targetIndex, 0, draggedEmployee);
        } else {
            // 如果目标ID无效，则作为安全措施，将其放回末尾
            employees.push(draggedEmployee);
            console.error(`Target employee with id ${targetEmployeeId} not found. Appending to the end.`);
        }
    }

    saveState();
}

/**
 * 更新或添加一个班次
 * @param {string} dateString - "YYYY-MM-DD"
 * @param {object} shiftData - The shift object to add or update
 */
export function upsertShift(dateString, shiftData) {
    if (!state.schedule[dateString]) {
        state.schedule[dateString] = [];
    }

    const index = state.schedule[dateString].findIndex(s => s.id === shiftData.id);

    if (index > -1) {
        // Update existing shift
        state.schedule[dateString][index] = { ...state.schedule[dateString][index], ...shiftData };
    } else {
        // Add new shift
        const newShift = {
            id: Date.now(), // Simple unique ID
            ...shiftData
        };
        state.schedule[dateString].push(newShift);
    }
    saveState();
}

/**
 * 删除一个班次
 * @param {string} dateString 
 * @param {number} shiftId 
 */
export function deleteShift(dateString, shiftId) {
    if (state.schedule[dateString]) {
        state.schedule[dateString] = state.schedule[dateString].filter(s => s.id !== shiftId);
        saveState();
    }
}

/**
 * Toggles a specific hour in the peak hours setting.
 * If the hour is already part of a period, it might be removed or the period adjusted.
 * This is a simplified implementation; more complex logic could handle merging periods.
 * @param {number} hour - The hour to toggle (e.g., 12 for 12:00-13:00).
 */
export function togglePeakHour(hour) {
    const period = { start: `${hour}:00`, end: `${hour + 1}:00` };
    const existingIndex = state.settings.peakHours.findIndex(p => p.start === period.start && p.end === period.end);

    if (existingIndex > -1) {
        // If it exists, remove it
        state.settings.peakHours.splice(existingIndex, 1);
    } else {
        // If it doesn't exist, add it
        state.settings.peakHours.push(period);
        // Simple sort to keep them in order
        state.settings.peakHours.sort((a, b) => parseInt(a.start, 10) - parseInt(b.start, 10));
    }
    saveState();
}

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
 * 获取指定日期所在周的所有排班数据
 * @param {Date} date - 周内的任意一天
 * @returns {Object.<string, Array>} - 以日期字符串为键，排班数组为值的对象
 */
export function getScheduleForWeek(date) {
    const scheduleForWeek = {};
    const currentWeekStart = new Date(date);
    currentWeekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // 调整到本周的周一
    currentWeekStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        const dateString = getFormattedDateString(day);
        scheduleForWeek[dateString] = state.schedule[dateString] || [];
    }
    return scheduleForWeek;
}

// 初始化时自动加载状态
loadState(); 