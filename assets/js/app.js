// 主应用程序
class HotpotOAApp {
    constructor() {
        this.isInitialized = false;
        this.currentPage = null;
        this.authManager = null;
        this.dbManager = null;
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            showLoading(true);

            // 初始化Supabase
            if (typeof initSupabase === 'function') {
                initSupabase();
            }

            // 初始化数据库管理器
            if (typeof initDatabase === 'function') {
                this.dbManager = initDatabase();
            }

            // 初始化认证管理器
            if (typeof initAuth === 'function') {
                this.authManager = initAuth();
            }

            // 设置全局错误处理
            this.setupErrorHandling();

            // 设置页面事件监听
            this.setupEventListeners();

            // 检查认证状态
            await this.checkAuthAndRedirect();

            this.isInitialized = true;

        } catch (error) {
            console.error('应用初始化失败:', error);
            // 如果是在登录页面，不显示错误提示
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                showToast('应用初始化失败，请刷新页面重试', 'error');
            }
        } finally {
            hideLoading();
        }
    }

    // 检查认证状态并重定向
    async checkAuthAndRedirect() {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('index.html') || currentPath === '/';

        try {
            // 只有在有认证功能时才检查
            if (typeof SupabaseAuth !== 'undefined') {
                const user = await SupabaseAuth.getCurrentUser();

                if (user && isAuthPage) {
                    // 已登录用户访问登录页，重定向到仪表板
                    window.location.href = 'dashboard.html';
                } else if (!user && !isAuthPage) {
                    // 未登录用户访问其他页面，重定向到登录页
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.log('认证检查跳过:', error.message);
            // 在登录页面时，认证错误是正常的
            if (!isAuthPage) {
                window.location.href = 'index.html';
            }
        }
    }

    // 设置错误处理
    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
            showToast('发生未知错误，请刷新页面重试', 'error');
        });

        // Promise错误处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise错误:', event.reason);
            showToast('操作失败，请重试', 'error');
        });
    }

    // 设置事件监听
    setupEventListeners() {
        // 页面加载完成事件
        document.addEventListener('DOMContentLoaded', () => {
            this.onPageLoad();
        });

        // 页面卸载事件
        window.addEventListener('beforeunload', () => {
            this.onPageUnload();
        });

        // 网络状态变化
        window.addEventListener('online', () => {
            showToast('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            showToast('网络连接已断开', 'warning');
        });
    }

    // 页面加载事件处理
    onPageLoad() {
        // 获取当前页面
        this.currentPage = this.getCurrentPageName();
        
        // 根据页面类型执行相应的初始化
        switch (this.currentPage) {
            case 'dashboard':
                this.initDashboard();
                break;
            case 'stores':
                this.initStoresPage();
                break;
            case 'staff':
                this.initStaffPage();
                break;
            case 'formulas':
                this.initFormulasPage();
                break;
            case 'documents':
                this.initDocumentsPage();
                break;
            case 'operations':
                this.initOperationsPage();
                break;
            case 'reports':
                this.initReportsPage();
                break;
            case 'admin':
                this.initAdminPage();
                break;
        }
    }

    // 页面卸载事件处理
    onPageUnload() {
        // 清理资源
        this.cleanup();
    }

    // 获取当前页面名称
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === 'index.html' || filename === '') {
            return 'auth';
        }
        
        return filename.replace('.html', '');
    }

    // 初始化仪表板
    async initDashboard() {
        try {
            // 加载组件
            await this.loadPageComponents();
            
            // 加载仪表板数据
            await this.loadDashboardData();
            
            // 初始化图表
            this.initDashboardCharts();
            
            // 更新日期时间
            this.updateDateTime();
            
        } catch (error) {
            console.error('仪表板初始化失败:', error);
            showToast('仪表板加载失败', 'error');
        }
    }

    // 加载页面组件
    async loadPageComponents() {
        const components = [
            { id: 'sidebar-container', path: 'components/sidebar.html' },
            { id: 'header-container', path: 'components/header.html' }
        ];

        for (const component of components) {
            await loadComponent(component.id, component.path);
        }
    }

    // 加载仪表板数据
    async loadDashboardData() {
        try {
            const stats = await this.dbManager.getDashboardStats();
            
            // 更新统计数据
            this.updateElement('store-count', stats.stores);
            this.updateElement('staff-count', stats.staff);
            this.updateElement('formula-count', stats.formulas);
            this.updateElement('daily-revenue', formatCurrency(stats.revenue));
            
        } catch (error) {
            console.error('加载仪表板数据失败:', error);
        }
    }

    // 初始化仪表板图表
    initDashboardCharts() {
        // 销售趋势图
        const salesCtx = document.getElementById('sales-chart');
        if (salesCtx) {
            new Chart(salesCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    datasets: [{
                        label: '销售额',
                        data: [12000, 15000, 13000, 18000, 16000, 22000, 25000],
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // 门店业绩图
        const storeCtx = document.getElementById('store-performance-chart');
        if (storeCtx) {
            new Chart(storeCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['总店', '分店A', '分店B', '分店C'],
                    datasets: [{
                        label: '月销售额',
                        data: [85000, 65000, 72000, 58000],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(168, 85, 247, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // 更新日期时间
    updateDateTime() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            dateElement.textContent = dateStr;
        }
    }

    // 初始化其他页面（占位符）
    initStoresPage() {
        console.log('初始化门店管理页面');
    }

    initStaffPage() {
        console.log('初始化员工管理页面');
    }

    initFormulasPage() {
        console.log('初始化配方管理页面');
    }

    initDocumentsPage() {
        console.log('初始化文档管理页面');
    }

    initOperationsPage() {
        console.log('初始化运营管理页面');
    }

    initReportsPage() {
        console.log('初始化报表分析页面');
    }

    initAdminPage() {
        console.log('初始化系统管理页面');
    }

    // 工具方法
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // 页面导航
    navigateTo(page) {
        const routes = {
            'dashboard': 'dashboard.html',
            'stores': 'pages/stores.html',
            'staff': 'pages/staff.html',
            'formulas': 'pages/formulas.html',
            'documents': 'pages/documents.html',
            'operations': 'pages/operations.html',
            'reports': 'pages/reports.html',
            'admin': 'pages/admin.html'
        };

        const url = routes[page];
        if (url) {
            window.location.href = url;
        } else {
            console.error('未知的页面:', page);
        }
    }

    // 清理资源
    cleanup() {
        // 清理定时器、事件监听器等
        console.log('清理应用资源');
    }

    // 获取应用状态
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            currentPage: this.currentPage,
            user: this.authManager?.getCurrentUser(),
            timestamp: new Date().toISOString()
        };
    }
}

// 全局应用实例
let hotpotApp = null;

// 初始化应用
function initApp() {
    if (!hotpotApp) {
        hotpotApp = new HotpotOAApp();
    }
    return hotpotApp;
}

// 获取应用实例
function getApp() {
    if (!hotpotApp) {
        initApp();
    }
    return hotpotApp;
}

// 全局导航函数
function navigateTo(page) {
    const app = getApp();
    app.navigateTo(page);
}

// 应用启动
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HotpotOAApp, initApp, getApp, navigateTo };
}
