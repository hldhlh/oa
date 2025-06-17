// 导入工具函数
import { loadSupabase, getCurrentUser, onAuthStateChange, logout, showNotification, showLoading, hideLoading } from '/utils/utils.js';

// 基础URL配置（用于构建绝对路径）
const BASE_URL = window.location.origin;

// 页面路由配置
const routes = {
    '/': `${BASE_URL}/pages/home/index.js`,
    '/home': `${BASE_URL}/pages/home/index.js`,
    '/login': `${BASE_URL}/pages/login/index.js`,
    '/register': `${BASE_URL}/pages/register/index.js`,
    '/dashboard': `${BASE_URL}/pages/dashboard/index.js`,
};

// 获取当前路径
const getCurrentPath = () => {
    const path = window.location.pathname;
    // 如果是直接访问子页面HTML，则提取路径
    if (path.includes('/pages/') && path.endsWith('/index.html')) {
        const pagePath = path.split('/pages/')[1].split('/index.html')[0];
        return `/${pagePath}`;
    }
    return path === '/' ? '/' : path.endsWith('/') ? path.slice(0, -1) : path;
};

// 渲染页面头部
async function renderHeader() {
    const user = await getCurrentUser();
    const headerElement = document.getElementById('header') || document.createElement('div');
    headerElement.id = 'header';
    
    // 创建头部HTML
    headerElement.innerHTML = `
        <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md px-4 py-3">
            <div class="container mx-auto flex justify-between items-center">
                <!-- Logo -->
                <a href="/" class="flex items-center gap-2">
                    <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">OA</div>
                    <span class="text-xl font-bold text-gray-800">办公自动化系统</span>
                </a>
                
                <!-- 导航菜单 -->
                <nav class="hidden md:flex items-center gap-6">
                    <a href="/" class="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
                        <svg class="w-5 h-5"><use href="#icon-home"></use></svg>
                        <span>首页</span>
                    </a>
                    ${user ? `
                        <a href="/dashboard" class="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors">
                            <svg class="w-5 h-5"><use href="#icon-document"></use></svg>
                            <span>工作台</span>
                        </a>
                    ` : ''}
                </nav>
                
                <!-- 用户菜单 -->
                <div class="relative" id="user-menu-container">
                    ${user ? `
                        <button id="user-menu-button" class="flex items-center gap-2 bg-background rounded-xl p-2 hover:shadow-sm transition-all">
                            <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium">
                                ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span class="hidden md:inline">${user.email || '用户'}</span>
                            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10">
                            <a href="/profile" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">个人资料</a>
                            <a href="/settings" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">设置</a>
                            <hr class="my-1 border-gray-200">
                            <button id="logout-button" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">退出登录</button>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <a href="/login" class="px-4 py-2 text-primary border border-primary rounded-xl hover:bg-primary hover:text-white transition-colors">登录</a>
                            <a href="/register" class="px-4 py-2 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-colors">注册</a>
                        </div>
                    `}
                </div>
                
                <!-- 移动端菜单按钮 -->
                <button id="mobile-menu-button" class="md:hidden flex items-center">
                    <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
            
            <!-- 移动端导航菜单 -->
            <div id="mobile-menu" class="hidden md:hidden mt-4 pt-4 border-t border-gray-200">
                <div class="container mx-auto">
                    <a href="/" class="block py-2 text-gray-600 hover:text-primary">首页</a>
                    ${user ? `<a href="/dashboard" class="block py-2 text-gray-600 hover:text-primary">工作台</a>` : ''}
                </div>
            </div>
        </header>
    `;
    
    // 将头部添加到文档中
    document.body.insertBefore(headerElement, document.body.firstChild);
    
    // 添加事件监听
    if (user) {
        // 用户菜单切换
        const userMenuButton = headerElement.querySelector('#user-menu-button');
        const userDropdown = headerElement.querySelector('#user-dropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });
            
            // 点击外部关闭菜单
            document.addEventListener('click', (event) => {
                const userMenuContainer = headerElement.querySelector('#user-menu-container');
                if (userMenuContainer && !userMenuContainer.contains(event.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
            
            // 退出登录
            const logoutButton = headerElement.querySelector('#logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    try {
                        await logout();
                        showNotification('退出登录成功', 'success');
                        window.location.href = '/';
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        showNotification('退出登录失败，请重试', 'error');
                    }
                });
            }
        }
    }
    
    // 移动端菜单切换
    const mobileMenuButton = headerElement.querySelector('#mobile-menu-button');
    const mobileMenu = headerElement.querySelector('#mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('active');
        });
    }
}

// 渲染页脚
function renderFooter() {
    const footerElement = document.getElementById('footer') || document.createElement('div');
    footerElement.id = 'footer';
    
    // 创建页脚HTML
    footerElement.innerHTML = `
        <footer class="mt-12 py-6 border-t border-gray-200">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">OA</div>
                    <span class="text-gray-600">办公自动化系统 &copy; ${new Date().getFullYear()}</span>
                </div>
                
                <div class="flex gap-6">
                    <a href="/about" class="text-gray-500 hover:text-primary transition-colors">关于我们</a>
                    <a href="/contact" class="text-gray-500 hover:text-primary transition-colors">联系我们</a>
                    <a href="/privacy" class="text-gray-500 hover:text-primary transition-colors">隐私政策</a>
                </div>
            </div>
        </footer>
    `;
    
    // 将页脚添加到文档中
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.appendChild(footerElement);
    }
}

// 显示加载指示器
function showLoader(contentElement) {
    contentElement.classList.add('content-loading');
    contentElement.classList.remove('content-ready');
    contentElement.innerHTML = `
        <div class="loader">
            <div class="loader-spinner"></div>
        </div>
    `;
}

// 显示错误信息
function showError(contentElement, message = '页面加载失败') {
    contentElement.innerHTML = `
        <div class="text-center py-10 page-enter">
            <div class="text-4xl mb-4">😢</div>
            <h2 class="text-2xl font-bold text-gray-700 mb-2">${message}</h2>
            <p class="text-gray-500">请稍后再试或返回<a href="/" class="text-primary hover:underline">首页</a></p>
        </div>
    `;
    
    // 触发重绘以应用过渡效果
    setTimeout(() => {
        contentElement.querySelector('.page-enter').classList.add('page-enter-active');
    }, 10);
}

// 渲染页面
const renderPage = async () => {
    const path = getCurrentPath();
    const routePath = routes[path] || routes['/'];
    
    // 获取内容元素
    const contentElement = document.getElementById('content');
    if (!contentElement) return;
    
    // 显示加载指示器
    showLoader(contentElement);
    
    try {
        // 显示全局加载状态
        showLoading();
        
        // 动态导入页面模块
        const pageModule = await import(routePath);
        
        // 检查是否成功导入
        if (pageModule && pageModule.default) {
            // 创建一个新的容器用于过渡效果
            const pageContainer = document.createElement('div');
            pageContainer.className = 'page-enter';
            
            // 清空内容区域并添加新容器
            contentElement.innerHTML = '';
            contentElement.appendChild(pageContainer);
            
            // 渲染页面内容到新容器
            await pageModule.default(pageContainer);
            
            // 应用过渡效果
            contentElement.classList.remove('content-loading');
            contentElement.classList.add('content-ready');
            
            // 触发重绘以应用过渡效果
            setTimeout(() => {
                pageContainer.classList.add('page-enter-active');
            }, 10);
        } else {
            showError(contentElement, '无法加载页面模块');
        }
    } catch (error) {
        console.error('页面加载失败:', error);
        showError(contentElement, '页面加载失败');
    } finally {
        // 隐藏全局加载状态
        hideLoading();
    }
};

// 导航到指定路径
export const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    renderPage();
};

// 为了向后兼容，将navigateTo添加到window对象
window.navigateTo = navigateTo;

// 监听浏览器前进/后退
window.addEventListener('popstate', renderPage);

// 初始化应用
const initApp = async () => {
    // 显示加载状态
    showLoading();
    
    try {
        // 初始化Supabase客户端
        await loadSupabase();
        
        // 渲染头部和页脚
        await renderHeader();
        renderFooter();
        
        // 监听认证状态变化
        onAuthStateChange(async (event, session) => {
            // 根据认证状态更新UI
            await renderHeader();
            
            // 如果用户登出且当前在需要认证的页面，则重定向到首页
            if (event === 'SIGNED_OUT' && getCurrentPath() === '/dashboard') {
                navigateTo('/');
            }
        });
        
        // 拦截所有链接点击
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                navigateTo(link.pathname);
            }
        });
        
        // 渲染当前页面
        await renderPage();
    } finally {
        // 隐藏加载状态
        hideLoading();
    }
};

// 启动应用
initApp(); 