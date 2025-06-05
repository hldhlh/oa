# 今岭火锅店OA系统

一个现代化的办公自动化系统，专为今岭火锅店设计，提供文档管理、配方管理、员工管理等功能。

## 🚀 功能特性

### 核心功能
- **用户认证系统** - 员工注册、登录、权限管理
- **仪表板** - 数据概览、快速操作、最近活动
- **文档管理** - 文件上传、分类、搜索、在线查看
- **配方管理** - 食谱录入、分类管理、难度标记
- **员工管理** - 员工信息、角色分配、状态管理
- **系统设置** - 个人资料、安全设置、系统配置

### 技术特性
- **响应式设计** - 完美支持桌面端和移动端
- **现代化UI** - 使用Tailwind CSS构建的简洁界面
- **实时数据** - 基于Supabase的实时数据同步
- **安全认证** - 完整的用户认证和权限控制
- **模块化架构** - 易于扩展和维护的代码结构

## 🛠️ 技术栈

- **前端**: HTML5, JavaScript (ES6+), Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: 静态文件托管 (可部署到任何静态托管服务)

## 📦 项目结构

```
oa/
├── index.html                 # 登录页面
├── dashboard.html            # 仪表板页面
├── assets/
│   ├── js/
│   │   ├── supabase.js      # Supabase配置和工具函数
│   │   ├── auth.js          # 认证相关功能
│   │   └── dashboard.js     # 仪表板功能
├── pages/
│   ├── documents/           # 文档管理模块
│   │   ├── index.html
│   │   └── documents.js
│   ├── recipes/             # 配方管理模块
│   │   ├── index.html
│   │   └── recipes.js
│   ├── employees/           # 员工管理模块
│   │   ├── index.html
│   │   └── employees.js
│   └── settings/            # 系统设置模块
│       ├── index.html
│       └── settings.js
└── README.md
```

## 🚀 快速开始

### 1. 环境准备

确保您有以下环境：
- 现代浏览器 (Chrome, Firefox, Safari, Edge)
- 本地Web服务器 (可选，用于开发)

### 2. Supabase配置

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 获取项目URL和API密钥
3. 更新 `assets/js/supabase.js` 中的配置：

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. 数据库设置

在Supabase SQL编辑器中执行以下SQL创建必要的表：

```sql
-- 文档表
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 配方表
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    ingredients TEXT[] NOT NULL,
    steps TEXT[] NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 员工表
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    hire_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
```

### 4. 运行项目

#### 方法1: 直接打开文件
直接在浏览器中打开 `index.html` 文件

#### 方法2: 使用本地服务器
```bash
# 使用Python
python -m http.server 8000

# 使用Node.js
npx serve .

# 使用PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 👥 使用说明

### 首次使用

1. **注册账号**: 在登录页面点击"立即注册"创建账号
2. **邮箱验证**: 检查邮箱并点击验证链接
3. **登录系统**: 使用注册的邮箱和密码登录

### 主要功能

#### 文档管理
- 上传各类文档文件 (PDF, DOC, DOCX, TXT, 图片)
- 按分类组织文档 (政策文件、操作流程、培训资料等)
- 搜索和筛选文档
- 在线查看和下载文档

#### 配方管理
- 添加火锅配方 (汤底、蘸料、小菜、饮品)
- 设置难度等级和详细步骤
- 按分类浏览配方
- 搜索特定配方

#### 员工管理
- 添加员工信息
- 分配角色和部门
- 管理员工状态
- 查看员工列表

#### 系统设置
- 更新个人资料
- 修改登录密码
- 查看系统信息
- 数据管理功能

## 🔧 自定义配置

### 修改主题颜色

在每个HTML文件的 `<script>` 标签中修改Tailwind配置：

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fef2f2',   // 浅色背景
                    500: '#ef4444',  // 主色调
                    600: '#dc2626',  // 悬停色
                    700: '#b91c1c'   // 激活色
                }
            }
        }
    }
}
```

### 添加新功能模块

1. 在 `pages/` 目录下创建新文件夹
2. 创建 `index.html` 和对应的 `.js` 文件
3. 在侧边栏导航中添加链接
4. 根据需要在Supabase中创建新表

## 📱 移动端支持

系统采用响应式设计，完美支持移动设备：
- 自适应布局
- 触摸友好的界面
- 移动端优化的导航

## 🔒 安全特性

- 基于Supabase的安全认证
- 行级安全策略 (RLS)
- 密码加密存储
- 会话管理
- CSRF保护

## 🚀 部署指南

### 静态托管部署

项目可以部署到任何静态托管服务：

1. **Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   - 直接拖拽项目文件夹到Netlify
   - 或连接Git仓库自动部署

3. **GitHub Pages**
   - 推送代码到GitHub仓库
   - 在仓库设置中启用Pages

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请：
- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件到 support@example.com

---

**今岭火锅店OA系统** - 让管理更简单，让工作更高效！ 🔥
