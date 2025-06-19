import { getState, upsertShift, deleteShift, togglePeakHour } from './data-handler.js';

// --- 模块常量 ---

// 定义排班时间轴的范围 (24小时制)
const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 27; // 27点即次日凌晨3点
const TOTAL_HOURS = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;
const MIN_SHIFT_DURATION_MINUTES = 30;
const MIN_SHIFT_WIDTH_PERCENT = (MIN_SHIFT_DURATION_MINUTES / (TOTAL_HOURS * 60)) * 100;

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
const contextMenuEl = document.getElementById('context-menu');

// --- Context Menu State ---
let contextMenuState = {
    visible: false,
    employeeId: null,
    timePercentage: null,
    dateString: null,
    shiftId: null, // Add shiftId for delete context
    context: null // 'track' or 'shift'
};

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
 * 将百分比转换为 "HH:MM" 格式的时间字符串, 并对齐到15分钟网格
 * @param {number} percentage
 * @returns {string}
 */
function percentageToTime(percentage) {
    const totalMinutes = (percentage / 100) * TOTAL_HOURS * 60;
    
    // Snap to nearest 30 minutes
    const snappedTotalMinutes = Math.round(totalMinutes / 30) * 30;
    
    const hoursOffset = Math.floor(snappedTotalMinutes / 60);
    const minutesOffset = snappedTotalMinutes % 60;
    
    const finalHour = SCHEDULE_START_HOUR + hoursOffset;
    const finalMinute = minutesOffset;
    
    // Pad with '0' if needed
    const hh = String(finalHour).padStart(2, '0');
    const mm = String(finalMinute).padStart(2, '0');
    
    return `${hh}:${mm}`;
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

function renderTimeline(peakHours) {
    timelineEl.innerHTML = ''; // 清空
    const timelineContent = document.createElement('div');
    timelineContent.className = 'pl-24 w-full flex'; // pl-24 for name column offset

    const isHourPeak = (hour) => {
        return peakHours.some(period => {
            const startH = parseInt(period.start, 10);
            const endH = parseInt(period.end, 10);
            return hour >= startH && hour < endH;
        });
    };

    for (let i = 0; i < TOTAL_HOURS; i++) {
        const hour = SCHEDULE_START_HOUR + i;
        const displayHour = hour % 24;

        const hourEl = document.createElement('div');
        hourEl.className = 'flex-1 text-center border-r border-gray-300 relative cursor-pointer hover:bg-yellow-100 transition-colors';
        
        // Add highlight if the hour is a peak hour
        if (isHourPeak(hour)) {
            hourEl.classList.add('bg-yellow-200');
        }
        
        // Add click listener to toggle peak hour status
        hourEl.addEventListener('click', () => {
            togglePeakHour(hour);
            document.dispatchEvent(new CustomEvent('state-updated'));
        });

        const label = document.createElement('span');
        label.className = 'relative z-10 pointer-events-none'; // Make label non-interactive
        label.textContent = `${displayHour}:00`;
        hourEl.appendChild(label);

        const halfHourLine = document.createElement('div');
        halfHourLine.className = 'js-grid-line hidden absolute left-1/2 top-0 h-full w-px bg-gray-200 border-r border-dashed border-gray-300';
        hourEl.appendChild(halfHourLine);

        timelineContent.appendChild(hourEl);
    }
    timelineEl.appendChild(timelineContent);
}

function renderSwimlanes(dateString, employees, schedule) {
    swimlanesContainerEl.innerHTML = ''; // 清空
    const peakHours = getState().settings.peakHours || [];

    // 为每一位员工都渲染一个泳道，无论其今天是否排班
    for (const employee of employees) {
        const swimlaneEl = document.createElement('div');
        swimlaneEl.className = 'flex items-center h-16 border-b border-gray-200';

        // Employee name column
        const nameEl = document.createElement('div');
        nameEl.className = 'w-24 font-semibold text-sm truncate pr-2 text-gray-700';
        nameEl.textContent = employee.name;
        
        // Timeline track
        const trackEl = document.createElement('div');
        trackEl.className = 'relative flex-1 h-full bg-gray-50';
        trackEl.dataset.employeeId = employee.id;

        // --- Add Peak Hour Highlights to each track ---
        // This ensures they are perfectly aligned with the shifts
        const peakHoursTrackContainer = document.createElement('div');
        peakHoursTrackContainer.className = 'absolute inset-0 pointer-events-none z-0';
        renderPeakHours(peakHours, peakHoursTrackContainer);
        trackEl.appendChild(peakHoursTrackContainer);

        // --- Add Background Grid to each track ---
        const gridContainer = document.createElement('div');
        // Add a JS hook and hide by default
        gridContainer.className = 'js-grid-line hidden absolute inset-0 flex';
        for (let i = 0; i < TOTAL_HOURS; i++) {
            const hourCell = document.createElement('div');
            hourCell.className = 'flex-1 border-r border-gray-200';
            const halfHourCell = document.createElement('div');
            halfHourCell.className = 'w-1/2 h-full border-r border-dashed border-gray-200';
            hourCell.appendChild(halfHourCell);
            gridContainer.appendChild(hourCell);
        }
        trackEl.appendChild(gridContainer);

        // --- Add Event Listeners for Drag and Drop ---
        
        trackEl.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessary to allow drop
            event.dataTransfer.dropEffect = 'copy';
            trackEl.classList.add('bg-yellow-100');
            document.dispatchEvent(new CustomEvent('state-updated'));
        });

        trackEl.addEventListener('dragleave', () => {
            trackEl.classList.remove('bg-yellow-100');
        });

        trackEl.addEventListener('drop', (event) => {
            event.preventDefault();
            trackEl.classList.remove('bg-yellow-100');
            
            // --- Distinguish between dropping a new employee and an existing shift ---
            const newEmployeeData = event.dataTransfer.getData('application/json+employee');
            const existingShiftData = event.dataTransfer.getData('application/json+shift');

            if (existingShiftData) {
                // --- Handle dropping an existing shift ---
                const { shift, initialOffsetX } = JSON.parse(existingShiftData);
                const targetEmployeeId = Number(trackEl.dataset.employeeId);

                const rect = trackEl.getBoundingClientRect();
                const dropX = event.clientX - rect.left;

                // Adjust for where the user initially clicked on the shift block
                const newLeftX = dropX - initialOffsetX;
                const newLeftPercentage = (newLeftX / rect.width) * 100;

                const newStartTime = percentageToTime(newLeftPercentage);
                const duration = calculateDuration(shift.start, shift.end);
                
                // Calculate new end time
                const [startH, startM] = newStartTime.split(':').map(Number);
                const durationMinutes = duration * 60;
                const endTotalMinutes = startH * 60 + startM + durationMinutes;
                const endH = Math.floor(endTotalMinutes / 60);
                const endM = endTotalMinutes % 60;
                const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                const updatedShift = {
                    ...shift,
                    employeeId: targetEmployeeId,
                    start: newStartTime,
                    end: newEndTime,
                };
                
                upsertShift(dateString, updatedShift);

            } else if (newEmployeeData) {
                // --- Handle dropping a new employee ---
                const draggedEmployee = JSON.parse(newEmployeeData);

                // 确保员工被放置在自己的泳道上 (this check might be redundant if we allow moving shifts, but good for creation)
                if (draggedEmployee.id !== Number(trackEl.dataset.employeeId)) {
                    console.warn("操作无效：请将员工拖拽至其本人的排班行以创建班次。");
                    return;
                }
                
                // Calculate start time based on drop position
                const rect = trackEl.getBoundingClientRect();
                const dropX = event.clientX - rect.left;
                const dropPercentage = (dropX / rect.width) * 100;
                const startTime = percentageToTime(dropPercentage);

                // Calculate end time (default 2-hour shift)
                const [startH, startM] = startTime.split(':').map(Number);
                const endH = startH + 2;
                const endTime = `${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

                const newShift = {
                    employeeId: draggedEmployee.id,
                    start: startTime,
                    end: endTime,
                    type: 'work',
                };
                
                upsertShift(dateString, newShift);
            }

            // Dispatch event to trigger UI refresh for both cases
            document.dispatchEvent(new CustomEvent('state-updated'));
        });

        // --- Add Context Menu Listener for TRACK ---
        trackEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡到document
            
            const rect = trackEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const timePercentage = (clickX / rect.width) * 100;
            
            contextMenuState = {
                visible: true,
                employeeId: employee.id,
                timePercentage: timePercentage,
                dateString: dateString,
                shiftId: null,
                context: 'track'
            };
            showContextMenu(e.pageX, e.pageY, 'track');
        });

        // Filter shifts for this employee
        const employeeShifts = schedule.filter(s => s.employeeId === employee.id);
        
        employeeShifts.forEach(shift => {
            const left = timeToPercentage(shift.start);
            const right = timeToPercentage(shift.end);
            const width = right - left;

            const shiftEl = document.createElement('div');
            // Make the block relative to contain absolute handles and apply base styles
            shiftEl.className = 'absolute h-10 top-3 rounded-lg flex items-center justify-center text-xs font-medium shadow-sm cursor-grab z-10';
            
            // --- REMOVED NATIVE DRAGGABLE ---
            // shiftEl.draggable = true; 
            shiftEl.dataset.shiftId = shift.id;
            
            // --- REFACTORED: Use a single mousedown handler for both moving and resizing ---
            shiftEl.addEventListener('mousedown', (e) => {
                const handle = e.target.closest('[data-handle]');
                if (handle) {
                    // It's a resize action, let the resize handler take over
                    handleResizeStart(e, shift, trackEl, shiftEl, dateString);
                } else {
                    // It's a move action
                    handleMoveStart(e, shift, trackEl, shiftEl, dateString);
                }
            });

            // --- Add Context Menu Listener for SHIFT ---
            shiftEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to prevent track context menu
                contextMenuState = { visible: true, employeeId: employee.id, dateString, shiftId: shift.id, context: 'shift' };
                showContextMenu(e.pageX, e.pageY, 'shift');
            });

            // --- Add Resize Handles for RESIZING ---
            const leftHandle = document.createElement('div');
            leftHandle.className = 'absolute top-0 left-0 h-full w-4 cursor-col-resize z-20';
            leftHandle.dataset.handle = 'left';

            const rightHandle = document.createElement('div');
            rightHandle.className = 'absolute top-0 right-0 h-full w-4 cursor-col-resize z-20';
            rightHandle.dataset.handle = 'right';

            shiftEl.appendChild(leftHandle);
            shiftEl.appendChild(rightHandle);

            // --- FIX: Restore the style properties for initial rendering ---
            shiftEl.style.left = `${left}%`;
            shiftEl.style.width = `${width}%`;

            let colors, textContent;
            if (shift.type === 'work') {
                colors = POSITION_COLORS[employee.position] || POSITION_COLORS.default;
                const duration = calculateDuration(shift.start, shift.end);
                textContent = `工作 (${duration.toFixed(1)}h)`;
            } else { // break
                colors = BREAK_COLORS;
                const duration = calculateDuration(shift.start, shift.end);
                textContent = `休息 (${duration.toFixed(1)}h)`;
            }
            
            shiftEl.classList.add(colors.bg, colors.text);
            
            // --- FIX: Add text via a child span to prevent overwriting handles ---
            const textEl = document.createElement('span');
            textEl.textContent = textContent;
            shiftEl.appendChild(textEl);

            trackEl.appendChild(shiftEl);
        });
        
        swimlaneEl.appendChild(nameEl);
        swimlaneEl.appendChild(trackEl);
        swimlanesContainerEl.appendChild(swimlaneEl);
    }
}

/**
 * Handles the start of a MOVE action
 */
const handleMoveStart = (e, shift, trackEl, shiftEl, dateString) => {
    e.preventDefault();
    e.stopPropagation();

    showGrid(); // Show grid on drag start

    const trackRect = trackEl.getBoundingClientRect();
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialLeftPercent = parseFloat(shiftEl.style.left);
    
    // Elevate the element being moved
    shiftEl.classList.add('shadow-lg', 'z-20');

    const handleMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - initialMouseX;
        const dy = moveEvent.clientY - initialMouseY;
        
        const dxPercent = (dx / trackRect.width) * 100;
        shiftEl.style.left = `${initialLeftPercent + dxPercent}%`;

        // Vertical movement for feedback remains in pixels, as it's temporary
        shiftEl.style.transform = `translateY(${dy}px)`;
    };

    const handleMouseUp = (upEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        hideGrid(); // Hide grid on drag end

        // Reset visual styles
        shiftEl.classList.remove('shadow-lg', 'z-20');
        shiftEl.style.transform = '';

        // Determine target swimlane
        const finalElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const targetTrack = finalElement ? finalElement.closest('.relative.flex-1') : null;

        if (!targetTrack) {
            // Dropped outside a valid track, revert by re-rendering
            document.dispatchEvent(new CustomEvent('state-updated'));
            return;
        }

        const targetEmployeeId = Number(targetTrack.dataset.employeeId);
        
        const finalLeftPercent = parseFloat(shiftEl.style.left);

        const newStartTime = percentageToTime(finalLeftPercent);
        const duration = calculateDuration(shift.start, shift.end);
        
        const [startH, startM] = newStartTime.split(':').map(Number);
        const durationMinutes = duration * 60;
        const endTotalMinutes = startH * 60 + startM + durationMinutes;
        const endH = Math.floor(endTotalMinutes / 60);
        const endM = endTotalMinutes % 60;
        const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
        const updatedShift = { ...shift, employeeId: targetEmployeeId, start: newStartTime, end: newEndTime };
        
        upsertShift(dateString, updatedShift);
        document.dispatchEvent(new CustomEvent('state-updated'));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
};

/**
 * Handles the start of a RESIZE action
 */
const handleResizeStart = (e, shift, trackEl, shiftEl, dateString) => {
    e.preventDefault();
    e.stopPropagation();

    showGrid(); // Show grid on resize start

    const handleType = e.target.dataset.handle;
    const trackRect = trackEl.getBoundingClientRect();
    const initialMouseX = e.clientX;
    const initialLeftPercent = parseFloat(shiftEl.style.left);
    const initialWidthPercent = parseFloat(shiftEl.style.width);

    const handleResizeMove = (moveEvent) => {
        const dx = moveEvent.clientX - initialMouseX;
        const dxPercent = (dx / trackRect.width) * 100;

        if (handleType === 'right') {
            let newWidth = initialWidthPercent + dxPercent;
            if (newWidth < MIN_SHIFT_WIDTH_PERCENT) {
                newWidth = MIN_SHIFT_WIDTH_PERCENT;
            }
            shiftEl.style.width = `${newWidth}%`;
        } else { // left handle
            let newWidth = initialWidthPercent - dxPercent;
            let newLeft = initialLeftPercent + dxPercent;
            if (newWidth < MIN_SHIFT_WIDTH_PERCENT) {
                newWidth = MIN_SHIFT_WIDTH_PERCENT;
                // Clamp left position to keep the right edge stationary
                newLeft = (initialLeftPercent + initialWidthPercent) - MIN_SHIFT_WIDTH_PERCENT;
            }
            shiftEl.style.left = `${newLeft}%`;
            shiftEl.style.width = `${newWidth}%`;
        }
    };

    const handleResizeEnd = () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        
        hideGrid(); // Hide grid on resize end

        const finalLeftPercent = parseFloat(shiftEl.style.left);
        const finalWidthPercent = parseFloat(shiftEl.style.width);

        const newStart = percentageToTime(finalLeftPercent);
        const newEnd = percentageToTime(finalLeftPercent + finalWidthPercent);
        
        const updatedShift = { ...shift, start: newStart, end: newEnd };
        upsertShift(dateString, updatedShift);
        document.dispatchEvent(new CustomEvent('state-updated'));
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
};

// --- Context Menu Control ---

function showContextMenu(x, y, context) {
    // Show/hide relevant sections
    const trackActions = contextMenuEl.querySelector('[data-context="track"]');
    const shiftActions = contextMenuEl.querySelector('[data-context="shift"]');

    if (context === 'track') {
        trackActions.classList.remove('hidden');
        shiftActions.classList.add('hidden');
    } else if (context === 'shift') {
        trackActions.classList.add('hidden');
        shiftActions.classList.remove('hidden');
    }

    contextMenuEl.style.left = `${x}px`;
    contextMenuEl.style.top = `${y}px`;
    contextMenuEl.classList.remove('hidden');
}

function hideContextMenu() {
    contextMenuEl.classList.add('hidden');
    contextMenuState.visible = false;
}

// Global click to hide context menu
document.addEventListener('click', (e) => {
    if (contextMenuState.visible && !contextMenuEl.contains(e.target)) {
        hideContextMenu();
    }
});

// Add event listeners to context menu buttons
contextMenuEl.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action || !contextMenuState.visible) return;

    const { employeeId, timePercentage, dateString, shiftId } = contextMenuState;

    if (action === 'delete-shift') {
        if (shiftId) {
            deleteShift(dateString, shiftId);
            document.dispatchEvent(new CustomEvent('state-updated'));
        }
        hideContextMenu();
        return;
    }

    const startTime = percentageToTime(timePercentage);

    let newShift;
    if (action === 'add-work') {
        const [startH, startM] = startTime.split(':').map(Number);
        const endH = startH + 2; // Default 2-hour work shift
        const endTime = `${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        newShift = {
            employeeId: employeeId,
            start: startTime,
            end: endTime,
            type: 'work',
        };
    } else if (action === 'add-break') {
        const [startH, startM] = startTime.split(':').map(Number);
        const endTotalMinutes = startH * 60 + startM + 30; // Default 30-min break
        const endH = Math.floor(endTotalMinutes / 60);
        const endM = endTotalMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        newShift = {
            employeeId: employeeId,
            start: startTime,
            end: endTime,
            type: 'break',
        };
    }

    if (newShift) {
        upsertShift(dateString, newShift);
        document.dispatchEvent(new CustomEvent('state-updated'));
    }

    hideContextMenu();
});

// --- Grid Visibility Control ---

function showGrid() {
    document.querySelectorAll('.js-grid-line').forEach(el => el.classList.remove('hidden'));
}

function hideGrid() {
    document.querySelectorAll('.js-grid-line').forEach(el => el.classList.add('hidden'));
}

/**
 * 主渲染函数，负责绘制整个排班板
 * @param {string} dateString - "YYYY-MM-DD"
 */
export function renderBoard(dateString) {
    const { employees, schedule, settings } = getState();
    const scheduleForDate = schedule[dateString] || [];
    
    renderTimeline(settings.peakHours || []);
    renderSwimlanes(dateString, employees, scheduleForDate);
}

/**
 * Renders the peak hour highlight overlays onto the schedule board.
 * @param {Array<object>} peakHours - Array of objects, e.g., [{ start: '12:00', end: '14:00' }]
 * @param {HTMLElement} container - The container to append the highlights to.
 */
function renderPeakHours(peakHours, container) {
    // Note: This adds divs directly to the provided container.
    // Ensure they are placed behind the actual shift blocks (shift blocks have z-10).
    container.innerHTML = ''; // Clear previous highlights
    
    (peakHours || []).forEach(period => {
        const left = timeToPercentage(period.start);
        const right = timeToPercentage(period.end);
        const width = right - left;

        if (width <= 0) return;

        const highlightEl = document.createElement('div');
        highlightEl.className = 'absolute top-0 h-full bg-yellow-400 opacity-20';
        highlightEl.style.left = `${left}%`;
        highlightEl.style.width = `${width}%`;

        container.appendChild(highlightEl);
    });
} 