// 配方管理功能
document.addEventListener('DOMContentLoaded', async function() {
    // 检查用户认证状态
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 初始化页面
    initializeRecipesPage(user);
    
    // 设置用户菜单
    setupUserMenu();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载配方列表
    loadRecipes();
});

// 初始化配方页面
function initializeRecipesPage(user) {
    // 设置用户信息
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    const userInitial = userName.charAt(0).toUpperCase();
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userInitial').textContent = userInitial;
}

// 设置用户菜单
function setupUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加配方按钮
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const recipeModal = document.getElementById('recipeModal');
    const cancelRecipe = document.getElementById('cancelRecipe');
    const recipeForm = document.getElementById('recipeForm');
    
    if (addRecipeBtn) {
        addRecipeBtn.addEventListener('click', function() {
            recipeModal.classList.remove('hidden');
        });
    }
    
    if (cancelRecipe) {
        cancelRecipe.addEventListener('click', function() {
            recipeModal.classList.add('hidden');
            recipeForm.reset();
        });
    }
    
    // 点击模态框背景关闭
    recipeModal.addEventListener('click', function(e) {
        if (e.target === recipeModal) {
            recipeModal.classList.add('hidden');
            recipeForm.reset();
        }
    });
    
    // 配方表单提交
    if (recipeForm) {
        recipeForm.addEventListener('submit', handleRecipeSubmit);
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // 筛选功能
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadRecipes);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', loadRecipes);
    }
}

// 处理配方提交
async function handleRecipeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recipeData = {
        name: formData.get('name'),
        category: formData.get('category'),
        difficulty: formData.get('difficulty'),
        ingredients: formData.get('ingredients').split('\n').filter(item => item.trim()),
        steps: formData.get('steps').split('\n').filter(item => item.trim()),
        notes: formData.get('notes'),
        created_by: (await getCurrentUser()).id
    };
    
    if (!recipeData.name || !recipeData.category || !recipeData.difficulty || 
        !recipeData.ingredients.length || !recipeData.steps.length) {
        showMessage('请填写完整的配方信息', 'error');
        return;
    }
    
    try {
        // 显示保存状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '保存中...';
        submitBtn.disabled = true;
        
        // 保存配方到数据库
        const { data, error } = await supabase
            .from('recipes')
            .insert([recipeData]);
        
        if (error) {
            throw error;
        }
        
        showMessage('配方添加成功！', 'success');
        
        // 关闭模态框并重置表单
        document.getElementById('recipeModal').classList.add('hidden');
        e.target.reset();
        
        // 重新加载配方列表
        loadRecipes();
        
    } catch (error) {
        console.error('添加配方失败:', error);
        showMessage('添加失败，请重试', 'error');
    } finally {
        // 恢复按钮状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 加载配方列表
async function loadRecipes() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        let query = supabase
            .from('recipes')
            .select('*');
        
        // 应用搜索条件
        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }
        
        // 应用分类筛选
        if (category) {
            query = query.eq('category', category);
        }
        
        // 应用排序
        query = query.order(sortBy, { ascending: false });
        
        const { data: recipes, error } = await query;
        
        if (error) {
            throw error;
        }
        
        renderRecipesList(recipes);
        
    } catch (error) {
        console.error('加载配方列表失败:', error);
        showMessage('加载配方列表失败', 'error');
    }
}

// 渲染配方列表
function renderRecipesList(recipes) {
    const recipesList = document.getElementById('recipesList');
    
    if (!recipes || recipes.length === 0) {
        recipesList.innerHTML = `
            <div class="col-span-full">
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">暂无配方</h3>
                    <p class="mt-1 text-sm text-gray-500">开始添加您的第一个配方</p>
                    <div class="mt-6">
                        <button type="button" onclick="document.getElementById('addRecipeBtn').click()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            添加配方
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    recipesList.innerHTML = recipes.map(recipe => `
        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div class="px-4 py-5 sm:p-6">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-medium text-gray-900 truncate">${recipe.name}</h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(recipe.category)}">
                        ${getCategoryName(recipe.category)}
                    </span>
                </div>
                
                <div class="flex items-center text-sm text-gray-500 mb-3">
                    <svg class="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    难度: ${getDifficultyName(recipe.difficulty)}
                    <span class="mx-2">•</span>
                    ${formatDate(recipe.created_at)}
                </div>
                
                <div class="text-sm text-gray-600 mb-4">
                    <p class="mb-2"><strong>食材:</strong> ${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}</p>
                    <p><strong>步骤:</strong> ${recipe.steps.length} 个步骤</p>
                </div>
                
                <div class="flex justify-between items-center">
                    <button onclick="viewRecipe('${recipe.id}')" class="text-primary-600 hover:text-primary-900 text-sm font-medium">
                        查看详情
                    </button>
                    <div class="flex space-x-2">
                        <button onclick="editRecipe('${recipe.id}')" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
                            编辑
                        </button>
                        <button onclick="deleteRecipe('${recipe.id}')" class="text-red-600 hover:text-red-900 text-sm font-medium">
                            删除
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 获取分类名称
function getCategoryName(category) {
    const categories = {
        'soup': '汤底',
        'sauce': '蘸料',
        'side': '小菜',
        'drink': '饮品'
    };
    return categories[category] || category;
}

// 获取分类颜色
function getCategoryColor(category) {
    const colors = {
        'soup': 'bg-red-100 text-red-800',
        'sauce': 'bg-yellow-100 text-yellow-800',
        'side': 'bg-green-100 text-green-800',
        'drink': 'bg-blue-100 text-blue-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
}

// 获取难度名称
function getDifficultyName(difficulty) {
    const difficulties = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难'
    };
    return difficulties[difficulty] || difficulty;
}

// 处理搜索
function handleSearch() {
    loadRecipes();
}

// 查看配方详情
function viewRecipe(id) {
    // 这里可以实现查看配方详情的功能
    showMessage('查看配方详情功能待实现', 'warning');
}

// 编辑配方
function editRecipe(id) {
    // 这里可以实现编辑配方的功能
    showMessage('编辑配方功能待实现', 'warning');
}

// 删除配方
async function deleteRecipe(id) {
    if (!confirm('确定要删除这个配方吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        showMessage('配方删除成功', 'success');
        loadRecipes();
        
    } catch (error) {
        console.error('删除配方失败:', error);
        showMessage('删除失败，请重试', 'error');
    }
}

// 导出函数供全局使用
window.recipesFunctions = {
    loadRecipes,
    viewRecipe,
    editRecipe,
    deleteRecipe
};
