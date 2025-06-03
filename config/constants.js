// 常量定义
const CONSTANTS = {
    // 用户角色
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager', 
        STAFF: 'staff',
        VIEWER: 'viewer'
    },

    // 门店状态
    STORE_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        MAINTENANCE: 'maintenance'
    },

    // 员工状态
    STAFF_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        ON_LEAVE: 'on_leave'
    },

    // 配方状态
    FORMULA_STATUS: {
        ACTIVE: 'active',
        DRAFT: 'draft',
        ARCHIVED: 'archived'
    },

    // 文档类型
    DOCUMENT_TYPES: {
        POLICY: 'policy',
        PROCEDURE: 'procedure',
        TRAINING: 'training',
        RECIPE: 'recipe',
        REPORT: 'report',
        OTHER: 'other'
    },

    // 文档状态
    DOCUMENT_STATUS: {
        ACTIVE: 'active',
        DRAFT: 'draft',
        ARCHIVED: 'archived'
    },

    // 审批状态
    APPROVAL_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },

    // 操作类型
    OPERATION_TYPES: {
        CREATE: 'create',
        UPDATE: 'update',
        DELETE: 'delete',
        VIEW: 'view',
        DOWNLOAD: 'download',
        UPLOAD: 'upload'
    },

    // 日志级别
    LOG_LEVELS: {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        DEBUG: 'debug'
    },

    // 消息类型
    MESSAGE_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};

// 导出常量
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
