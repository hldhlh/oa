// 渲染页脚组件
export function renderFooter(container) {
    // 创建页脚HTML
    container.innerHTML = `
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
} 