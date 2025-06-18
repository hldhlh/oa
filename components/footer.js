export function getFooter() {
    return `
        <footer class="bg-black text-white py-4 mt-8">
            <div class="container mx-auto px-6 text-center">
                <p>&copy; ${new Date().getFullYear()} OA 系统. 保留所有权利.</p>
            </div>
        </footer>
    `;
} 