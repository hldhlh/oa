// 文档管理功能
document.addEventListener('DOMContentLoaded', async function() {
    // 检查用户认证状态
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 初始化页面
    initializeDocumentsPage(user);
    
    // 设置用户菜单
    setupUserMenu();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载文档列表
    loadDocuments();
});

// 初始化文档页面
function initializeDocumentsPage(user) {
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
    // 上传按钮
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const cancelUpload = document.getElementById('cancelUpload');
    const uploadForm = document.getElementById('uploadForm');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            uploadModal.classList.remove('hidden');
        });
    }
    
    if (cancelUpload) {
        cancelUpload.addEventListener('click', function() {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        });
    }
    
    // 点击模态框背景关闭
    uploadModal.addEventListener('click', function(e) {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        }
    });
    
    // 上传表单提交
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
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
        categoryFilter.addEventListener('change', loadDocuments);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', loadDocuments);
    }
}

// 处理文件上传
async function handleFileUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const file = formData.get('file');
    const name = formData.get('name');
    const category = formData.get('category');
    const description = formData.get('description');
    
    if (!file || !name || !category) {
        showMessage('请填写完整信息', 'error');
        return;
    }
    
    // 检查文件大小（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
        showMessage('文件大小不能超过10MB', 'error');
        return;
    }
    
    try {
        // 显示上传进度
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '上传中...';
        submitBtn.disabled = true;
        
        // 生成唯一文件名
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // 上传文件到Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);
        
        if (uploadError) {
            throw uploadError;
        }
        
        // 获取文件URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
        
        // 保存文档信息到数据库
        const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert([
                {
                    name: name,
                    category: category,
                    description: description,
                    file_name: fileName,
                    file_url: urlData.publicUrl,
                    file_size: file.size,
                    file_type: file.type,
                    uploaded_by: (await getCurrentUser()).id
                }
            ]);
        
        if (docError) {
            throw docError;
        }
        
        showMessage('文档上传成功！', 'success');
        
        // 关闭模态框并重置表单
        document.getElementById('uploadModal').classList.add('hidden');
        e.target.reset();
        
        // 重新加载文档列表
        loadDocuments();
        
    } catch (error) {
        console.error('上传文档失败:', error);
        showMessage('上传失败，请重试', 'error');
    } finally {
        // 恢复按钮状态
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 加载文档列表
async function loadDocuments() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        let query = supabase
            .from('documents')
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
        
        const { data: documents, error } = await query;
        
        if (error) {
            throw error;
        }
        
        renderDocumentsList(documents);
        
    } catch (error) {
        console.error('加载文档列表失败:', error);
        showMessage('加载文档列表失败', 'error');
    }
}

// 渲染文档列表
function renderDocumentsList(documents) {
    const documentsList = document.getElementById('documentsList');
    
    if (!documents || documents.length === 0) {
        documentsList.innerHTML = `
            <li class="px-6 py-4">
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无文档</h3>
                        <p class="mt-1 text-sm text-gray-500">开始上传您的第一个文档</p>
                        <div class="mt-6">
                            <button type="button" onclick="document.getElementById('uploadBtn').click()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                上传文档
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        `;
        return;
    }
    
    documentsList.innerHTML = documents.map(doc => `
        <li class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        ${getFileIcon(doc.file_type)}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${doc.name}</div>
                        <div class="text-sm text-gray-500">
                            ${getCategoryName(doc.category)} • ${formatFileSize(doc.file_size)} • ${formatDate(doc.created_at)}
                        </div>
                        ${doc.description ? `<div class="text-xs text-gray-400 mt-1">${doc.description}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="viewDocument('${doc.file_url}')" class="text-primary-600 hover:text-primary-900 text-sm font-medium">
                        查看
                    </button>
                    <button onclick="downloadDocument('${doc.file_url}', '${doc.name}')" class="text-gray-600 hover:text-gray-900 text-sm font-medium">
                        下载
                    </button>
                    <button onclick="deleteDocument('${doc.id}')" class="text-red-600 hover:text-red-900 text-sm font-medium">
                        删除
                    </button>
                </div>
            </div>
        </li>
    `).join('');
}

// 获取文件图标
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) {
        return `<svg class="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
        </svg>`;
    } else if (fileType.includes('image')) {
        return `<svg class="h-10 w-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
        </svg>`;
    } else if (fileType.includes('word') || fileType.includes('document')) {
        return `<svg class="h-10 w-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
        </svg>`;
    } else {
        return `<svg class="h-10 w-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
        </svg>`;
    }
}

// 获取分类名称
function getCategoryName(category) {
    const categories = {
        'policy': '政策文件',
        'procedure': '操作流程',
        'training': '培训资料',
        'other': '其他'
    };
    return categories[category] || category;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 处理搜索
function handleSearch() {
    loadDocuments();
}

// 查看文档
function viewDocument(url) {
    window.open(url, '_blank');
}

// 下载文档
function downloadDocument(url, name) {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 删除文档
async function deleteDocument(id) {
    if (!confirm('确定要删除这个文档吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        showMessage('文档删除成功', 'success');
        loadDocuments();
        
    } catch (error) {
        console.error('删除文档失败:', error);
        showMessage('删除失败，请重试', 'error');
    }
}

// 导出函数供全局使用
window.documentsFunctions = {
    loadDocuments,
    viewDocument,
    downloadDocument,
    deleteDocument
};
