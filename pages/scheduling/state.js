// pages/scheduling/state.js
// This module will manage the application's state. 

// 从本地存储加载设置或使用默认值
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('timeline_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            return {
                timelineStartHour: parsed.startHour || 8,
                timelineEndHour: parsed.endHour || 20,
                pixelsPerHour: parsed.pixelsPerHour || 100,
                snapMinutes: parsed.snapMinutes || 30
            };
        }
    } catch (e) {
        console.error('加载设置失败:', e);
    }
    
    // 默认设置
    return {
        timelineStartHour: 8,  // 默认从早上8点开始
        timelineEndHour: 20,   // 默认到晚上8点结束
        pixelsPerHour: 100,    // 每小时100像素
        snapMinutes: 30        // 30分钟对齐
    };
}

const settings = loadSettings();

const state = {
    currentUser: null,
    currentTeams: [],
    selectedTeamId: null,
    schedules: [],
    timelineStartHour: settings.timelineStartHour,
    timelineEndHour: settings.timelineEndHour,
    pixelsPerHour: settings.pixelsPerHour,
    snapMinutes: settings.snapMinutes,
};

const listeners = [];

function notifyListeners() {
    listeners.forEach(listener => listener(state));
}

export function getState() {
    return { ...state };
}

export function setState(newState) {
    Object.assign(state, newState);
    
    // 如果更新了时间轴设置，保存到本地存储
    if (newState.timelineStartHour !== undefined || 
        newState.timelineEndHour !== undefined || 
        newState.pixelsPerHour !== undefined ||
        newState.snapMinutes !== undefined) {
        
        localStorage.setItem('timeline_settings', JSON.stringify({
            startHour: state.timelineStartHour,
            endHour: state.timelineEndHour,
            pixelsPerHour: state.pixelsPerHour,
            snapMinutes: state.snapMinutes
        }));
    }
    
    notifyListeners();
}

export function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

// Derived state
export function getSnapGridPixels() {
    return (state.pixelsPerHour / 60) * state.snapMinutes;
} 