// 员工管理功能
document.addEventListener('DOMContentLoaded', async function() {
    // 检查用户认证状态
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 初始化页面
    initializeEmployeesPage(user);
    
    // 设置用户菜单
    setupUserMenu();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载员工列表
    loadEmployees();
});

// 初始化员工页面
function initializeEmployeesPage(user) {
    // 设置用户信息
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    const userInitial = userName.charAt(0).toUpperCase();
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userInitial').textContent = userInitial;
    
    // 设置默认入职日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('employeeHireDate').value = today;
}

// 设置用户菜单
function setupUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加员工按钮
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const employeeModal = document.getElementById('employeeModal');
    const cancelEmployee = document.getElementById('cancelEmployee');
    const employeeForm = document.getElementById('employeeForm');
    
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            employeeModal.classList.remove('hidden');
        });
    }
    
    if (cancelEmployee) {
        cancelEmployee.addEventListener('click', function() {
            employeeModal.classList.add('hidden');
            employeeForm.reset();
            // 重置入职日期为今天
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('employeeHireDate').value = today;
        });
    }
    
    // 点击模态框背景关闭
    employeeModal.addEventListener('click', function(e) {
        if (e.target === employeeModal) {
            employeeModal.classList.add('hidden');
            employeeForm.reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('employeeHireDate').value = today;
        }
    });
    
    // 员工表单提交
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // 筛选功能
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (roleFilter) {
        roleFilter.addEventListener('change', loadEmployees);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadEmployees);
    }
}

// 处理员工提交
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const employeeData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        department: formData.get('department'),
        hire_date: formData.get('hire_date'),
        status: 'active',
        created_by: (await getCurrentUser()).id
    };
    
    if (!employeeData.name || !employeeData.email || !employeeData.role || 
        !employeeData.department || !employeeData.hire_date) {
        showMessage('请填写完整的员工信息', 'error');
        return;
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeData.email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return;
    }
    
    try {
        // 显示保存状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '保存中...';
        submitBtn.disabled = true;
        
        // 检查邮箱是否已存在
        const { data: existingEmployee, error: checkError } = await supabase
            .from('employees')
            .select('email')
            .eq('email', employeeData.email)
            .single();
        
        if (existingEmployee) {
            showMessage('该邮箱已被使用', 'error');
            return;
        }
        
        // 保存员工到数据库
        const { data, error } = await supabase
            .from('employees')
            .insert([employeeData]);
        
        if (error) {
            throw error;
        }
        
        showMessage('员工添加成功！', 'success');
        
        // 关闭模态框并重置表单
        document.getElementById('employeeModal').classList.add('hidden');
        e.target.reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('employeeHireDate').value = today;
        
        // 重新加载员工列表
        loadEmployees();
        
    } catch (error) {
        console.error('添加员工失败:', error);
        showMessage('添加失败，请重试', 'error');
    } finally {
        // 恢复按钮状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 加载员工列表
async function loadEmployees() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const role = document.getElementById('roleFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        let query = supabase
            .from('employees')
            .select('*');
        
        // 应用搜索条件
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }
        
        // 应用角色筛选
        if (role) {
            query = query.eq('role', role);
        }
        
        // 应用状态筛选
        if (status) {
            query = query.eq('status', status);
        }
        
        // 按创建时间排序
        query = query.order('created_at', { ascending: false });
        
        const { data: employees, error } = await query;
        
        if (error) {
            throw error;
        }
        
        renderEmployeesList(employees);
        
    } catch (error) {
        console.error('加载员工列表失败:', error);
        showMessage('加载员工列表失败', 'error');
    }
}

// 渲染员工列表
function renderEmployeesList(employees) {
    const employeesList = document.getElementById('employeesList');
    
    if (!employees || employees.length === 0) {
        employeesList.innerHTML = `
            <li class="px-6 py-4">
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无员工</h3>
                        <p class="mt-1 text-sm text-gray-500">开始添加您的第一个员工</p>
                        <div class="mt-6">
                            <button type="button" onclick="document.getElementById('addEmployeeBtn').click()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                添加员工
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        `;
        return;
    }
    
    employeesList.innerHTML = employees.map(employee => `
        <li class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span class="text-primary-600 font-medium text-sm">${employee.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${employee.name}</div>
                        <div class="text-sm text-gray-500">${employee.email}</div>
                        ${employee.phone ? `<div class="text-xs text-gray-400">${employee.phone}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}">
                                ${getRoleName(employee.role)}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}">
                                ${getStatusName(employee.status)}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${getDepartmentName(employee.department)} • 入职: ${formatDate(employee.hire_date)}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editEmployee('${employee.id}')" class="text-primary-600 hover:text-primary-900 text-sm font-medium">
                            编辑
                        </button>
                        <button onclick="toggleEmployeeStatus('${employee.id}', '${employee.status}')" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
                            ${employee.status === 'active' ? '停用' : '启用'}
                        </button>
                        <button onclick="deleteEmployee('${employee.id}')" class="text-red-600 hover:text-red-900 text-sm font-medium">
                            删除
                        </button>
                    </div>
                </div>
            </div>
        </li>
    `).join('');
}

// 获取角色名称
function getRoleName(role) {
    const roles = {
        'admin': '管理员',
        'manager': '经理',
        'employee': '员工'
    };
    return roles[role] || role;
}

// 获取角色颜色
function getRoleColor(role) {
    const colors = {
        'admin': 'bg-red-100 text-red-800',
        'manager': 'bg-blue-100 text-blue-800',
        'employee': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
}

// 获取状态名称
function getStatusName(status) {
    const statuses = {
        'active': '在职',
        'inactive': '离职'
    };
    return statuses[status] || status;
}

// 获取状态颜色
function getStatusColor(status) {
    const colors = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// 获取部门名称
function getDepartmentName(department) {
    const departments = {
        'kitchen': '厨房',
        'service': '服务',
        'management': '管理',
        'finance': '财务'
    };
    return departments[department] || department;
}

// 处理搜索
function handleSearch() {
    loadEmployees();
}

// 编辑员工
function editEmployee(id) {
    // 这里可以实现编辑员工的功能
    showMessage('编辑员工功能待实现', 'warning');
}

// 切换员工状态
async function toggleEmployeeStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? '启用' : '停用';
    
    if (!confirm(`确定要${action}这个员工吗？`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('employees')
            .update({ status: newStatus })
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        showMessage(`员工${action}成功`, 'success');
        loadEmployees();
        
    } catch (error) {
        console.error(`${action}员工失败:`, error);
        showMessage(`${action}失败，请重试`, 'error');
    }
}

// 删除员工
async function deleteEmployee(id) {
    if (!confirm('确定要删除这个员工吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        showMessage('员工删除成功', 'success');
        loadEmployees();
        
    } catch (error) {
        console.error('删除员工失败:', error);
        showMessage('删除失败，请重试', 'error');
    }
}

// 导出函数供全局使用
window.employeesFunctions = {
    loadEmployees,
    editEmployee,
    toggleEmployeeStatus,
    deleteEmployee
};
