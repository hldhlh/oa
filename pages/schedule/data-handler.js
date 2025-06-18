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

// 初始化时自动加载状态
loadState(); 