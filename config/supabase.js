// Supabase配置
const SUPABASE_CONFIG = {
    url: 'https://ainzxxuoweieowjyalgf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s'
};

// 应用配置
const APP_CONFIG = {
    name: '火锅店OA系统',
    version: '1.0.0',
    debug: true,
    defaultPageSize: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
};

// 权限配置
const PERMISSIONS = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer'
};

// 页面路由配置
const ROUTES = {
    dashboard: 'dashboard.html',
    auth: 'pages/auth.html',
    stores: 'pages/stores.html',
    staff: 'pages/staff.html',
    formulas: 'pages/formulas.html',
    documents: 'pages/documents.html',
    operations: 'pages/operations.html',
    reports: 'pages/reports.html',
    admin: 'pages/admin.html'
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, APP_CONFIG, PERMISSIONS, ROUTES };
}
