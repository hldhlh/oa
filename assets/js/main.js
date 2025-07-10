// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 确保Supabase已初始化
    await supabasePromise;
    
    // 加载组件
    await loadComponents();
    
    // 检查用户是否已登录
    const user = await checkUserSession();
    
    // 如果用户未登录且不在登录页面，则重定向到登录页面
    if (!user && !window.location.pathname.includes('index.html')) {
        redirectToLogin();
        return;
    }
    
    // 设置登出按钮
    setupLogoutButton();
    
    // 加载用户信息
    if (user) {
        loadUserInfo(user);
    }
    
    // 高亮当前菜单项
    highlightCurrentMenuItem();
});

// 加载组件
async function loadComponents() {
    try {
        // 加载头部
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const headerResponse = await fetch('/components/header.html');
            if (headerResponse.ok) {
                headerContainer.innerHTML = await headerResponse.text();
            } else {
                console.error('加载头部组件失败:', headerResponse.status);
            }
        }
        
        // 移除侧边栏容器
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.remove();
        }
    } catch (error) {
        console.error('加载组件失败:', error);
    }
}

// 设置登出按钮
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const supabase = window.supabase;
                const { error } = await supabase.auth.signOut();
                
                if (error) throw error;
                
                // 登出成功，重定向到登录页面
                redirectToLogin();
            } catch (error) {
                console.error('登出失败:', error);
                alert('登出失败: ' + error.message);
            }
        });
    }
}

// 加载用户信息
async function loadUserInfo(user) {
    try {
        const supabase = window.supabase;
        
        // 获取用户个人资料
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        // 显示用户信息 - 特别处理id="user-name"元素，添加欢迎词
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const userName = profile.full_name || user.email;
            const greeting = getGreeting();
            userNameElement.textContent = `${greeting}，${userName}`;
        }
        
        // 处理其他可能的用户名称元素
        const otherUserNameElements = document.querySelectorAll('.user-name:not(#user-name)');
        otherUserNameElements.forEach(el => {
            el.textContent = profile.full_name || user.email;
        });
        
        // 处理头像元素
        const userAvatarElements = document.querySelectorAll('.user-avatar');
        userAvatarElements.forEach(el => {
            if (profile.avatar_url) {
                el.src = profile.avatar_url;
                el.alt = profile.full_name || user.email;
            } else {
                // 使用内联SVG代替默认头像图片
                el.style.display = 'none';
                const parent = el.parentNode;
                if (parent) {
                    const svgElement = document.createElement('div');
                    svgElement.className = 'user-avatar-svg';
                    svgElement.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `;
                    parent.appendChild(svgElement);
                }
            }
        });
        
        console.log('用户信息已加载:', profile.full_name || user.email);
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 高亮当前菜单项
function highlightCurrentMenuItem() {
    const currentPath = window.location.pathname;
    
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // 检查当前路径是否包含链接的href
        if (href && currentPath.includes(href) && href !== '/') {
            link.classList.add('active');
        }
    });
}

// 根据当前时间获取合适的问候语
function getGreeting() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return '早上好';
    } else if (hour >= 12 && hour < 14) {
        return '中午好';
    } else if (hour >= 14 && hour < 18) {
        return '下午好';
    } else {
        return '晚上好';
    }
}
