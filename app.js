// 导入工具函数
import { loadSupabase } from './utils/api.js';
import { getCurrentUser, onAuthStateChange } from './utils/auth.js';

// 导入组件
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

// 页面路由配置
const routes = {
    '/': './pages/home/index.js',
    '/home': './pages/home/index.js',
    '/login': './pages/login/index.js',
    '/register': './pages/register/index.js',
    '/dashboard': './pages/dashboard/index.js',
};

// 获取当前路径
const getCurrentPath = () => {
    const path = window.location.pathname;
    return path === '/' ? '/' : path.endsWith('/') ? path.slice(0, -1) : path;
};

// 渲染页面
const renderPage = async () => {
    const path = getCurrentPath();
    const routePath = routes[path] || routes['/'];
    
    try {
        // 渲染头部
        const headerElement = document.createElement('div');
        headerElement.id = 'header';
        document.getElementById('app').prepend(headerElement);
        renderHeader(headerElement);
        
        // 渲染内容
        const contentElement = document.getElementById('content');
        contentElement.innerHTML = '<div class="flex justify-center items-center h-32"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>';
        
        // 动态导入页面模块
        const pageModule = await import(routePath);
        if (pageModule && pageModule.default) {
            pageModule.default(contentElement);
        }
        
        // 渲染页脚
        const footerElement = document.createElement('div');
        footerElement.id = 'footer';
        document.getElementById('app').appendChild(footerElement);
        renderFooter(footerElement);
    } catch (error) {
        console.error('页面加载失败:', error);
        document.getElementById('content').innerHTML = `
            <div class="text-center py-10">
                <div class="text-4xl mb-4">😢</div>
                <h2 class="text-2xl font-bold text-gray-700 mb-2">页面加载失败</h2>
                <p class="text-gray-500">请稍后再试或返回<a href="/" class="text-primary hover:underline">首页</a></p>
            </div>
        `;
    }
};

// 导航到指定路径
const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    renderPage();
};

// 监听浏览器前进/后退
window.addEventListener('popstate', renderPage);

// 初始化应用
const initApp = async () => {
    // 初始化Supabase客户端
    await loadSupabase();
    
    // 监听认证状态变化
    onAuthStateChange((event, session) => {
        // 根据认证状态更新UI
        const headerElement = document.getElementById('header');
        if (headerElement) {
            renderHeader(headerElement);
        }
        
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
    renderPage();
};

// 启动应用
initApp(); 