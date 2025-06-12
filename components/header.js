import { getCurrentUser, logout } from '../utils/auth.js';
import { showNotification } from '../utils/helpers.js';

// 渲染头部组件
export async function renderHeader(container) {
    const user = await getCurrentUser();
    
    // 创建头部HTML
    container.innerHTML = `
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
        
        <!-- 占位元素，防止内容被固定导航栏遮挡 -->
        <div class="h-16 md:h-16"></div>
    `;
    
    // 添加事件监听
    if (user) {
        // 用户菜单切换
        const userMenuButton = container.querySelector('#user-menu-button');
        const userDropdown = container.querySelector('#user-dropdown');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });
            
            // 点击外部关闭菜单
            document.addEventListener('click', (event) => {
                const userMenuContainer = container.querySelector('#user-menu-container');
                if (userMenuContainer && !userMenuContainer.contains(event.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
            
            // 退出登录
            const logoutButton = container.querySelector('#logout-button');
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
    const mobileMenuButton = container.querySelector('#mobile-menu-button');
    const mobileMenu = container.querySelector('#mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('active');
        });
    }
    
    // 添加滚动事件监听器
    const header = container.querySelector('header');
    if (header) {
        // 初始检查滚动位置
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // 监听滚动事件
        const handleScroll = () => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        
        window.addEventListener('scroll', handleScroll);
    }
} 