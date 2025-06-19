export function getHeader() {
    return `
        <header class="bg-black text-white shadow-md">
            <nav class="container mx-auto px-6 py-4 flex justify-between items-center">
                <a href="#" onclick="window.location.hash=''; return false;" class="text-xl font-bold">OA 系统</a>
                <div class="hidden md:flex items-center" id="nav-links">
                    <!-- 桌面端链接将通过 app.js 注入 -->
                </div>
                <div class="md:hidden">
                    <button id="mobile-menu-button" class="text-white focus:outline-none">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </nav>
            <div id="mobile-menu" class="hidden md:hidden px-6 pb-4">
                 <!-- 移动端链接将通过 app.js 注入 -->
            </div>
        </header>
    `;
} 