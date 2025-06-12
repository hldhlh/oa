import { getCurrentUser, requireAuth } from '../../utils/auth.js';
import { formatDate } from '../../utils/helpers.js';
import { createCard, createBadge, createTable } from '../../components/ui.js';

// 仪表盘页面渲染函数
export default async function renderDashboardPage(container) {
    // 验证用户是否已登录
    if (!await requireAuth()) {
        return;
    }
    
    // 获取当前用户
    const user = await getCurrentUser();
    
    // 创建仪表盘内容
    container.innerHTML = `
        <div class="py-8">
            <!-- 欢迎区域 -->
            <div class="bg-white rounded-2xl shadow-neumorphism p-6 mb-8">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">欢迎回来，${user.user_metadata?.username || '用户'}</h1>
                        <p class="text-gray-600 mt-2">今天是 ${formatDate(new Date(), 'YYYY年MM月DD日')}，祝您工作愉快！</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <div class="flex items-center gap-2 bg-primary bg-opacity-10 rounded-xl p-3">
                            <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-medium">
                                ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">${user.user_metadata?.username || '用户'}</div>
                                <div class="text-sm text-gray-500">${user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 快捷操作 -->
            <h2 class="text-xl font-bold text-gray-800 mb-4">快捷操作</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div id="quick-action-1"></div>
                <div id="quick-action-2"></div>
                <div id="quick-action-3"></div>
                <div id="quick-action-4"></div>
            </div>
            
            <!-- 数据概览 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <!-- 待办事项 -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">待办事项</h2>
                    <div id="todo-list" class="bg-white rounded-2xl shadow-neumorphism p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-700">今日任务</h3>
                            <button class="text-primary hover:underline text-sm">查看全部</button>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center">
                                <input type="checkbox" class="h-5 w-5 text-primary rounded mr-3">
                                <span class="text-gray-800">完成项目提案</span>
                                <span class="ml-auto text-sm text-gray-500">10:00</span>
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" class="h-5 w-5 text-primary rounded mr-3">
                                <span class="text-gray-800">回复客户邮件</span>
                                <span class="ml-auto text-sm text-gray-500">11:30</span>
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" class="h-5 w-5 text-primary rounded mr-3">
                                <span class="text-gray-800">准备周会报告</span>
                                <span class="ml-auto text-sm text-gray-500">14:00</span>
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" class="h-5 w-5 text-primary rounded mr-3">
                                <span class="text-gray-800">审核团队文档</span>
                                <span class="ml-auto text-sm text-gray-500">16:30</span>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <div class="flex">
                                <input type="text" placeholder="添加新任务..." class="flex-1 border-none bg-transparent focus:outline-none text-gray-700">
                                <button class="text-primary font-medium">添加</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 通知 -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">最新通知</h2>
                    <div id="notifications" class="bg-white rounded-2xl shadow-neumorphism p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-700">系统通知</h3>
                            <button class="text-primary hover:underline text-sm">全部标记为已读</button>
                        </div>
                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium text-gray-800">新的审批请求</span>
                                        <span class="text-xs text-gray-500">10分钟前</span>
                                    </div>
                                    <p class="text-sm text-gray-600">张三提交了一个请假申请，等待您的审批</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium text-gray-800">文档更新</span>
                                        <span class="text-xs text-gray-500">1小时前</span>
                                    </div>
                                    <p class="text-sm text-gray-600">李四更新了项目计划文档，点击查看详情</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between">
                                        <span class="font-medium text-gray-800">系统维护通知</span>
                                        <span class="text-xs text-gray-500">昨天</span>
                                    </div>
                                    <p class="text-sm text-gray-600">系统将于本周六进行例行维护，请提前做好准备</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 最近文档 -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">最近文档</h2>
                    <button class="text-primary hover:underline">查看全部</button>
                </div>
                <div id="recent-documents"></div>
            </div>
            
            <!-- 团队成员 -->
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">团队成员</h2>
                    <button class="text-primary hover:underline">管理团队</button>
                </div>
                <div class="bg-white rounded-2xl shadow-neumorphism p-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="flex flex-col items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div class="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold mb-2">ZS</div>
                            <div class="font-medium text-gray-800">张三</div>
                            <div class="text-sm text-gray-500">产品经理</div>
                        </div>
                        <div class="flex flex-col items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mb-2">LS</div>
                            <div class="font-medium text-gray-800">李四</div>
                            <div class="text-sm text-gray-500">UI设计师</div>
                        </div>
                        <div class="flex flex-col items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div class="w-16 h-16 rounded-full bg-green-400 flex items-center justify-center text-white text-xl font-bold mb-2">WW</div>
                            <div class="font-medium text-gray-800">王五</div>
                            <div class="text-sm text-gray-500">前端开发</div>
                        </div>
                        <div class="flex flex-col items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div class="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-white text-xl font-bold mb-2">ZL</div>
                            <div class="font-medium text-gray-800">赵六</div>
                            <div class="text-sm text-gray-500">后端开发</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 创建快捷操作卡片
    const quickAction1 = createCard({
        title: '新建文档',
        content: `
            <div class="flex justify-center">
                <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
        `,
        hoverable: true,
        onClick: () => console.log('新建文档')
    });
    
    const quickAction2 = createCard({
        title: '发起审批',
        content: `
            <div class="flex justify-center">
                <svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
            </div>
        `,
        hoverable: true,
        onClick: () => console.log('发起审批')
    });
    
    const quickAction3 = createCard({
        title: '安排会议',
        content: `
            <div class="flex justify-center">
                <svg class="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            </div>
        `,
        hoverable: true,
        onClick: () => console.log('安排会议')
    });
    
    const quickAction4 = createCard({
        title: '添加任务',
        content: `
            <div class="flex justify-center">
                <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
            </div>
        `,
        hoverable: true,
        onClick: () => console.log('添加任务')
    });
    
    // 添加快捷操作卡片到页面
    document.getElementById('quick-action-1').appendChild(quickAction1);
    document.getElementById('quick-action-2').appendChild(quickAction2);
    document.getElementById('quick-action-3').appendChild(quickAction3);
    document.getElementById('quick-action-4').appendChild(quickAction4);
    
    // 创建最近文档表格
    const recentDocumentsTable = createTable({
        columns: [
            { title: '文档名称', dataIndex: 'name' },
            { title: '创建者', dataIndex: 'creator' },
            { title: '最后修改', dataIndex: 'lastModified' },
            { title: '类型', dataIndex: 'type', render: (type) => {
                let badgeType = 'default';
                switch (type) {
                    case '文档':
                        badgeType = 'primary';
                        break;
                    case '表格':
                        badgeType = 'success';
                        break;
                    case '幻灯片':
                        badgeType = 'warning';
                        break;
                    case '合同':
                        badgeType = 'info';
                        break;
                }
                return createBadge({ text: type, type: badgeType }).outerHTML;
            }},
            { title: '操作', dataIndex: 'id', render: (id) => `
                <div class="flex gap-2">
                    <button class="text-blue-500 hover:text-blue-700">查看</button>
                    <button class="text-gray-500 hover:text-gray-700">编辑</button>
                </div>
            `}
        ],
        data: [
            { id: 1, name: '项目计划书.docx', creator: '张三', lastModified: '今天 10:30', type: '文档' },
            { id: 2, name: '财务报表.xlsx', creator: '李四', lastModified: '昨天 15:45', type: '表格' },
            { id: 3, name: '产品提案.pptx', creator: '王五', lastModified: '2天前', type: '幻灯片' },
            { id: 4, name: '服务协议.pdf', creator: '赵六', lastModified: '1周前', type: '合同' }
        ],
        hoverable: true,
        striped: true,
        onRowClick: (row) => console.log('查看文档', row)
    });
    
    // 添加最近文档表格到页面
    document.getElementById('recent-documents').appendChild(recentDocumentsTable);
} 