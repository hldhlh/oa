import { getHeader } from './components/header.js';
import { getFooter } from './components/footer.js';
import { onAuthStateChange, logout, getSession } from './utils/auth.js';

let supabase; // 将在api.js中初始化

const protectedRoutes = ['home', 'schedule'];

const loadLayout = () => {
    document.getElementById('header-placeholder').innerHTML = getHeader();
    document.getElementById('footer-placeholder').innerHTML = getFooter();
    updateUserNav(null); // 初始渲染为未登录状态
};

const loadPage = async (page) => {
    const mainContent = document.getElementById('main-content');
    // 清理旧的页面脚本和内容
    const oldScript = document.getElementById('page-script');
    if (oldScript) {
        oldScript.remove();
    }
    mainContent.innerHTML = '';

    try {
        const response = await fetch(`./pages/${page}/index.html`);
        if (!response.ok) {
            throw new Error('页面加载失败');
        }
        mainContent.innerHTML = await response.text();
        
        // 加载并执行页面特定的JS模块
        const script = document.createElement('script');
        script.id = 'page-script';
        script.type = 'module';
        script.src = `./pages/${page}/index.js`;
        document.body.appendChild(script);

    } catch (error) {
        mainContent.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
};

const router = async () => {
    const hash = window.location.hash.substring(1).split('?')[0] || 'home';
    const session = await getSession();

    if (!session && protectedRoutes.includes(hash)) {
        window.location.hash = 'login';
        return;
    }

    if (session && (hash === 'login' || hash === 'register')) {
        window.location.hash = '';
        return;
    }
    
    loadPage(hash);
};

const updateUserNav = (user) => {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (user) {
        navLinks.innerHTML = `
            <a href="#home" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">主页</a>
            <a href="#schedule" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">日程</a>
            <span class="px-3 py-2 text-sm font-medium">你好, ${user.email}</span>
            <a href="#" id="logout-button" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">退出</a>
        `;
        document.getElementById('logout-button')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
            // onAuthStateChange将处理重定向
        });
    } else {
        navLinks.innerHTML = `
            <a href="#login" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">登录</a>
            <a href="#register" class="px-3 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700">注册</a>
        `;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    loadLayout();
    
    // 首次加载时手动调用路由
    await router();
    
    // 监听hash变化
    window.addEventListener('hashchange', router);

    // 监听认证状态以更新UI，并处理登出后的最终重定向
    await onAuthStateChange((event, session) => {
        updateUserNav(session?.user);
        
        // 作为补充，确保登出后总是能跳转到登录页
        if (event === 'SIGNED_OUT') {
            window.location.hash = 'login';
        }
        
        // 可以在这里处理其他事件，比如PASSWORD_RECOVERY
    });
}); 