export function getHeader() {
    return `
        <header class="bg-black text-white shadow-md">
            <nav class="container mx-auto px-6 py-4 flex justify-between items-center">
                <a href="#" onclick="window.location.hash=''; return false;" class="text-xl font-bold">OA 系统</a>
                <div id="nav-links">
                    <a href="#login" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">登录</a>
                    <a href="#register" class="px-3 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700">注册</a>
                </div>
            </nav>
        </header>
    `;
} 