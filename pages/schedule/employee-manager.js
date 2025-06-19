import { getState, addEmployee, deleteEmployee, reorderEmployees } from './data-handler.js';

let fullRedrawCallback = () => {};

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
let contextMenuEl; // 将在init时创建
let employeeModalEl; // 新建员工的模态框

// --- 右键菜单状态 ---
let contextMenuState = {
    visible: false,
    employeeId: null,
    employeeName: null,
};

function createContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'employee-context-menu';
    menu.className = 'hidden absolute z-50 bg-white border border-gray-300 rounded shadow-lg py-1 text-sm';
    menu.innerHTML = `
        <a href="#" data-action="new" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">新建员工</a>
        <a href="#" data-action="delete" class="block px-4 py-2 text-red-600 hover:bg-red-100">删除员工</a>
    `;
    document.body.appendChild(menu);
    contextMenuEl = menu;

    // --- 全局点击事件，用于隐藏菜单 ---
    document.addEventListener('click', () => {
        if (contextMenuState.visible) {
            hideContextMenu();
        }
    });

    // --- 菜单点击事件委托 ---
    contextMenuEl.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;

        if (action === 'new') {
            handleNewEmployee();
        } else if (action === 'delete') {
            handleDeleteEmployee();
        }
        hideContextMenu();
    });
}

function showContextMenu(x, y, employeeId, employeeName) {
    contextMenuState = { visible: true, employeeId, employeeName };
    contextMenuEl.style.left = `${x}px`;
    contextMenuEl.style.top = `${y}px`;
    contextMenuEl.classList.remove('hidden');

    // 根据是否在员工身上点击，决定是否显示"删除"选项
    const deleteOption = contextMenuEl.querySelector('[data-action="delete"]');
    if (employeeId) {
        deleteOption.style.display = 'block';
        deleteOption.textContent = `删除 "${employeeName}"`;
    } else {
        deleteOption.style.display = 'none';
    }
}

function hideContextMenu() {
    contextMenuState.visible = false;
    if(contextMenuEl) {
        contextMenuEl.classList.add('hidden');
    }
}

// --- 模态框逻辑 ---

function createEmployeeModal() {
    const modal = document.createElement('div');
    modal.id = 'employee-modal';
    // 默认隐藏，使用flex进行居中
    modal.className = 'hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50';
    
    const positions = Object.keys(POSITION_COLORS).filter(p => p !== 'default');
    const types = ['全职', '兼职'];

    modal.innerHTML = `
        <div class="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">新建员工</h3>
            <form id="employee-form">
                <div class="space-y-4">
                    <div>
                        <label for="employee-name" class="block text-sm font-medium text-gray-700">姓名</label>
                        <input type="text" id="employee-name" name="name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm">
                    </div>
                    <div>
                        <label for="employee-position" class="block text-sm font-medium text-gray-700">岗位</label>
                        <select id="employee-position" name="position" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md">
                            ${positions.map(p => `<option>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="employee-type" class="block text-sm font-medium text-gray-700">类型</label>
                        <select id="employee-type" name="type" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md">
                            ${types.map(t => `<option>${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" id="cancel-employee-modal" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">取消</button>
                    <button type="submit" class="bg-black text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-gray-800 focus:outline-none">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    employeeModalEl = modal;

    // --- 事件监听 ---
    employeeModalEl.querySelector('#cancel-employee-modal').addEventListener('click', hideEmployeeModal);
    employeeModalEl.querySelector('#employee-form').addEventListener('submit', handleSaveEmployee);
    
    // 点击背景遮罩关闭模态框
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'employee-modal') {
            hideEmployeeModal();
        }
    });
}

function showEmployeeModal() {
    employeeModalEl.querySelector('form').reset(); // 重置表单
    employeeModalEl.classList.remove('hidden');
}

function hideEmployeeModal() {
    employeeModalEl.classList.add('hidden');
}

function handleSaveEmployee(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const employeeData = {
        name: formData.get('name'),
        position: formData.get('position'),
        type: formData.get('type'),
    };

    if (!employeeData.name) {
        alert('请输入员工姓名');
        return;
    }

    addEmployee(employeeData);
    hideEmployeeModal();
    fullRedrawCallback();
}

async function handleNewEmployee() {
    showEmployeeModal();
}

async function handleDeleteEmployee() {
    const { employeeId, employeeName } = contextMenuState;
    if (!employeeId) return;

    if (confirm(`确定要删除员工 "${employeeName}" 吗？\n该员工的所有排班记录也将被一并删除。`)) {
        deleteEmployee(employeeId);
        fullRedrawCallback();
    }
}


/**
 * 初始化员工管理器
 * @param {function} redrawCallback - 用于在数据变更后重绘整个面板的回调函数
 */
export function initEmployeeManager(redrawCallback) {
    fullRedrawCallback = redrawCallback;
    createContextMenu();
    createEmployeeModal();
    setupDragAndDrop();

    // 在员工列表的空白区域右键，只显示"新建"
    employeeListEl.addEventListener('contextmenu', (e) => {
        // 只有当右键点击的是列表容器本身而不是某个员工项时才触发
        if (e.target === employeeListEl) {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY, null, null);
        }
    });
}

// --- 新的拖放排序逻辑 ---
function setupDragAndDrop() {
    let draggedItem = null;

    // 一个更稳定、更明显的占位符
    const placeholder = document.createElement('div');
    placeholder.className = 'h-12 bg-blue-100 border-2 border-dashed border-blue-400 rounded-md my-1';

    employeeListEl.addEventListener('dragstart', (e) => {
        const employeeDiv = e.target.closest('[data-employee-id]');
        if (!employeeDiv) return;

        draggedItem = employeeDiv;
        
        const employee = { id: Number(draggedItem.dataset.employeeId) };
        e.dataTransfer.setData('application/json+employee', JSON.stringify(employee));
        e.dataTransfer.effectAllowed = 'move';

        // 使用 'invisible' 来隐藏元素但保留其布局空间，防止列表"跳动"
        setTimeout(() => {
            if (draggedItem) draggedItem.classList.add('invisible');
        }, 0);
    });

    employeeListEl.addEventListener('dragend', () => {
        // 清理拖动状态
        if (draggedItem) {
            draggedItem.classList.remove('invisible');
            draggedItem = null;
        }
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
    });

    employeeListEl.addEventListener('dragover', (e) => {
        e.preventDefault(); // 允许放置
        if (!draggedItem || draggedItem === e.target) return;

        const children = Array.from(employeeListEl.children).filter(child => child !== placeholder && child !== draggedItem);
        let inserted = false;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const rect = child.getBoundingClientRect();
            const midpointY = rect.top + rect.height / 2;

            if (e.clientY < midpointY) {
                if (placeholder.nextSibling !== child) { // 避免不必要的DOM操作
                    employeeListEl.insertBefore(placeholder, child);
                }
                inserted = true;
                break;
            }
        }

        if (!inserted && children.length > 0) {
            // 如果没有找到插入点（鼠标在所有元素下方），则添加到末尾
            if (employeeListEl.lastChild !== placeholder) {
                employeeListEl.appendChild(placeholder);
            }
        } else if (children.length === 0) {
            // 如果列表为空，直接添加占位符
            if (!placeholder.parentNode) {
                employeeListEl.appendChild(placeholder);
            }
        }
    });

    employeeListEl.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (!placeholder.parentNode || !draggedItem) return; // 如果没有有效的放置位置或没有被拖动的项，则中止

        const draggedEmployeeId = Number(draggedItem.dataset.employeeId);
        const nextElement = placeholder.nextElementSibling;
        const targetEmployeeId = nextElement ? Number(nextElement.dataset.employeeId) : null;
        
        // 在更新数据之前，从DOM中移除占位符
        placeholder.parentNode.removeChild(placeholder);

        reorderEmployees(draggedEmployeeId, targetEmployeeId);
        fullRedrawCallback();
    });
}


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

        // --- 右键菜单事件 ---
        employeeDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation(); // 防止触发父容器的右键事件
            showContextMenu(e.pageX, e.pageY, employee.id, employee.name);
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