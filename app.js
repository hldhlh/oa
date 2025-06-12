// 导入工具函数
import { loadSupabase } from './utils/api.js';
import { getCurrentUser, onAuthStateChange } from './utils/auth.js';

// 导入组件
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';

// 加载SVG图标
const loadIcons = async () => {
    try {
        const response = await fetch('./assets/icons.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        document.body.appendChild(svgDoc.documentElement);
    } catch (error) {
        console.error('加载图标失败:', error);
    }
};

// 页面路由配置
const routes = {
    '/': './pages/home/index.js',
    '/home': './pages/home/index.js',
    '/login': './pages/login/index.js',
    '/register': './pages/register/index.js',
    '/dashboard': './pages/dashboard/index.js',
};

// 检查是否为主页面
const isMainPage = window.location.pathname === '/' || 
                   window.location.pathname === '/index.html' || 
                   window.location.pathname.endsWith('/oa/') || 
                   window.location.pathname.endsWith('/oa/index.html');

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

// 渲染页面
const renderPage = async () => {
    const path = getCurrentPath();
    const routePath = routes[path] || routes['/'];
    const appElement = document.getElementById('app');
    
    try {
        // 只在主页面添加header和footer
        if (isMainPage) {
            // 清除现有的header和footer
            const existingHeader = document.getElementById('header');
            if (existingHeader) {
                existingHeader.remove();
            }
            
            const existingFooter = document.getElementById('footer');
            if (existingFooter) {
                existingFooter.remove();
            }
            
            // 渲染头部 - 插入到body开始位置
            const headerElement = document.createElement('div');
            headerElement.id = 'header';
            document.body.insertBefore(headerElement, document.body.firstChild);
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
            appElement.appendChild(footerElement);
            renderFooter(footerElement);
        } else {
            // 在子页面只渲染内容
            const contentElement = document.getElementById('content');
            if (contentElement) {
                contentElement.innerHTML = '<div class="flex justify-center items-center h-32"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>';
                
                // 动态导入页面模块
                const pageModule = await import(routePath);
                if (pageModule && pageModule.default) {
                    pageModule.default(contentElement);
                }
            }
        }
    } catch (error) {
        console.error('页面加载失败:', error);
        const contentElement = document.getElementById('content');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="text-center py-10">
                    <div class="text-4xl mb-4">😢</div>
                    <h2 class="text-2xl font-bold text-gray-700 mb-2">页面加载失败</h2>
                    <p class="text-gray-500">请稍后再试或返回<a href="/" class="text-primary hover:underline">首页</a></p>
                </div>
            `;
        }
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
    // 加载SVG图标
    await loadIcons();
    
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