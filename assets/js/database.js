// 数据库操作封装
class DatabaseManager {
    constructor() {
        this.tables = {
            stores: new SupabaseTable('stores'),
            staff: new SupabaseTable('staff'),
            formulas: new SupabaseTable('formulas'),
            documents: new SupabaseTable('documents'),
            userProfiles: new SupabaseTable('user_profiles'),
            auditLogs: new SupabaseTable('audit_logs'),
            categories: new SupabaseTable('categories'),
            ingredients: new SupabaseTable('ingredients')
        };
    }

    // 获取仪表板统计数据
    async getDashboardStats() {
        try {
            const [stores, staff, formulas, documents] = await Promise.all([
                this.tables.stores.findAll(),
                this.tables.staff.findAll(),
                this.tables.formulas.findAll(),
                this.tables.documents.findAll()
            ]);

            // 计算今日营业额（模拟数据）
            const today = new Date().toISOString().split('T')[0];
            const dailyRevenue = Math.floor(Math.random() * 50000) + 20000;

            return {
                stores: stores.length,
                staff: staff.length,
                formulas: formulas.length,
                documents: documents.length,
                revenue: dailyRevenue
            };
        } catch (error) {
            console.error('获取仪表板统计数据失败:', error);
            return {
                stores: 0,
                staff: 0,
                formulas: 0,
                documents: 0,
                revenue: 0
            };
        }
    }

    // 门店管理
    async getStores(options = {}) {
        return await this.tables.stores.findAll(options);
    }

    async getStoreById(id) {
        return await this.tables.stores.findById(id);
    }

    async createStore(storeData) {
        const data = {
            ...storeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        return await this.tables.stores.create(data);
    }

    async updateStore(id, storeData) {
        const data = {
            ...storeData,
            updated_at: new Date().toISOString()
        };
        return await this.tables.stores.update(id, data);
    }

    async deleteStore(id) {
        return await this.tables.stores.delete(id);
    }

    // 员工管理
    async getStaff(options = {}) {
        return await this.tables.staff.findAll(options);
    }

    async getStaffById(id) {
        return await this.tables.staff.findById(id);
    }

    async createStaff(staffData) {
        const data = {
            ...staffData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        return await this.tables.staff.create(data);
    }

    async updateStaff(id, staffData) {
        const data = {
            ...staffData,
            updated_at: new Date().toISOString()
        };
        return await this.tables.staff.update(id, data);
    }

    async deleteStaff(id) {
        return await this.tables.staff.delete(id);
    }

    // 配方管理
    async getFormulas(options = {}) {
        return await this.tables.formulas.findAll(options);
    }

    async getFormulaById(id) {
        return await this.tables.formulas.findById(id);
    }

    async createFormula(formulaData) {
        const data = {
            ...formulaData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
        };
        return await this.tables.formulas.create(data);
    }

    async updateFormula(id, formulaData) {
        const data = {
            ...formulaData,
            updated_at: new Date().toISOString()
        };
        return await this.tables.formulas.update(id, data);
    }

    async deleteFormula(id) {
        return await this.tables.formulas.delete(id);
    }

    async searchFormulas(searchTerm) {
        return await this.tables.formulas.search('name', searchTerm);
    }

    // 文档管理
    async getDocuments(options = {}) {
        return await this.tables.documents.findAll(options);
    }

    async getDocumentById(id) {
        return await this.tables.documents.findById(id);
    }

    async createDocument(documentData) {
        const data = {
            ...documentData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        return await this.tables.documents.create(data);
    }

    async updateDocument(id, documentData) {
        const data = {
            ...documentData,
            updated_at: new Date().toISOString()
        };
        return await this.tables.documents.update(id, data);
    }

    async deleteDocument(id) {
        return await this.tables.documents.delete(id);
    }

    async searchDocuments(searchTerm) {
        return await this.tables.documents.search('title', searchTerm);
    }

    // 分类管理
    async getCategories(type = null) {
        if (type) {
            return await this.tables.categories.findWhere({ type });
        }
        return await this.tables.categories.findAll();
    }

    async createCategory(categoryData) {
        const data = {
            ...categoryData,
            created_at: new Date().toISOString()
        };
        return await this.tables.categories.create(data);
    }

    // 原料管理
    async getIngredients(options = {}) {
        return await this.tables.ingredients.findAll(options);
    }

    async createIngredient(ingredientData) {
        const data = {
            ...ingredientData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        return await this.tables.ingredients.create(data);
    }

    // 用户资料管理
    async getUserProfile(userId) {
        const profiles = await this.tables.userProfiles.findWhere({ user_id: userId });
        return profiles.length > 0 ? profiles[0] : null;
    }

    async updateUserProfile(userId, profileData) {
        const existingProfile = await this.getUserProfile(userId);
        
        if (existingProfile) {
            return await this.tables.userProfiles.update(existingProfile.id, {
                ...profileData,
                updated_at: new Date().toISOString()
            });
        } else {
            return await this.tables.userProfiles.create({
                user_id: userId,
                ...profileData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
    }

    // 审计日志
    async getAuditLogs(options = {}) {
        return await this.tables.auditLogs.findAll({
            ...options,
            orderBy: { column: 'timestamp', ascending: false }
        });
    }

    async createAuditLog(logData) {
        return await this.tables.auditLogs.create({
            ...logData,
            timestamp: new Date().toISOString()
        });
    }

    // 高级搜索
    async globalSearch(searchTerm, types = ['documents', 'formulas']) {
        const results = {};
        
        for (const type of types) {
            try {
                switch (type) {
                    case 'documents':
                        results.documents = await this.searchDocuments(searchTerm);
                        break;
                    case 'formulas':
                        results.formulas = await this.searchFormulas(searchTerm);
                        break;
                    case 'staff':
                        results.staff = await this.tables.staff.search('name', searchTerm);
                        break;
                    case 'stores':
                        results.stores = await this.tables.stores.search('name', searchTerm);
                        break;
                }
            } catch (error) {
                console.error(`搜索 ${type} 失败:`, error);
                results[type] = [];
            }
        }
        
        return results;
    }

    // 批量操作
    async batchCreate(tableName, dataArray) {
        const table = this.tables[tableName];
        if (!table) {
            throw new Error(`表 ${tableName} 不存在`);
        }

        const results = [];
        for (const data of dataArray) {
            try {
                const result = await table.create(data);
                results.push(result);
            } catch (error) {
                console.error(`批量创建失败:`, error);
                results.push({ error: error.message });
            }
        }
        
        return results;
    }

    async batchUpdate(tableName, updates) {
        const table = this.tables[tableName];
        if (!table) {
            throw new Error(`表 ${tableName} 不存在`);
        }

        const results = [];
        for (const { id, data } of updates) {
            try {
                const result = await table.update(id, data);
                results.push(result);
            } catch (error) {
                console.error(`批量更新失败:`, error);
                results.push({ error: error.message });
            }
        }
        
        return results;
    }

    async batchDelete(tableName, ids) {
        const table = this.tables[tableName];
        if (!table) {
            throw new Error(`表 ${tableName} 不存在`);
        }

        const results = [];
        for (const id of ids) {
            try {
                await table.delete(id);
                results.push({ id, success: true });
            } catch (error) {
                console.error(`批量删除失败:`, error);
                results.push({ id, error: error.message });
            }
        }
        
        return results;
    }
}

// 全局数据库管理器实例
let dbManager = null;

// 初始化数据库管理器
function initDatabase() {
    if (!dbManager) {
        dbManager = new DatabaseManager();
    }
    return dbManager;
}

// 获取数据库管理器实例
function getDatabase() {
    if (!dbManager) {
        initDatabase();
    }
    return dbManager;
}

// 便捷方法
async function getDashboardStats() {
    const db = getDatabase();
    return await db.getDashboardStats();
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseManager, initDatabase, getDatabase, getDashboardStats };
}
