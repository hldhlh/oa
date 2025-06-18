# OA系统 - 办公自动化系统

一个基于纯JavaScript和Tailwind CSS的极简办公自动化系统，无需构建工具，直接在浏览器中运行。

## 特点

- **纯JS实现**：使用原生JavaScript，无需任何框架
- **零构建**：无需构建工具，直接在浏览器中运行
- **Tailwind CSS**：所有样式通过Tailwind类实现
- **组件化**：通用组件通过script标签导入复用
- **页面独立**：每个页面有独立的HTML和JS文件
- **按需加载**：只加载当前页面所需的资源
- **Supabase认证**：集成Supabase进行用户认证和数据管理
- **可爱风设计**：采用Neumorphism设计风格

## 项目结构

```
oa/
├── assets/           # 静态资源
│   ├── css/          # CSS文件
│   │   ├── tailwind.css     # 编译后的Tailwind CSS
│   │   └── tailwind-src.css # Tailwind源文件
│   ├── styles.css    # 自定义样式
│   └── icons.svg     # SVG图标
├── components/       # 通用组件
│   ├── header.js     # 页头组件
│   ├── footer.js     # 页脚组件
│   └── ui.js         # UI组件库
├── pages/            # 页面文件夹
│   ├── home/         # 首页
│   │   ├── index.html # 首页HTML
│   │   └── index.js   # 首页JS
│   ├── login/        # 登录页面
│   │   ├── index.html # 登录页HTML
│   │   └── index.js   # 登录页JS
│   ├── register/     # 注册页面
│   │   ├── index.html # 注册页HTML
│   │   └── index.js   # 注册页JS
│   └── dashboard/    # 工作台页面
│       ├── index.html # 工作台HTML
│       └── index.js   # 工作台JS
├── utils/            # 工具函数
│   ├── api.js        # API请求
│   ├── auth.js       # 认证相关
│   └── helpers.js    # 辅助函数
├── migrations/       # 数据库迁移脚本
├── app.js            # 全局JS
├── tailwind.config.js # Tailwind配置
├── postcss.config.js # PostCSS配置
└── index.html        # 主入口HTML
```

## 功能模块

- **用户认证**：注册、登录、登出
- **文档管理**：创建、查看、编辑文档
- **流程审批**：发起审批、审批流程跟踪
- **团队协作**：团队成员管理、任务分配
- **待办事项**：任务管理、提醒

## 技术栈

- **JavaScript**：原生JavaScript (ES6+)
- **Tailwind CSS**：样式框架
- **Supabase**：后端服务 (认证、数据库)
- **PostCSS**：CSS处理

## 开始使用

1. 克隆仓库
```
git clone https://github.com/yourusername/oa-system.git
```

2. 使用HTTP服务器运行项目
```
# 使用Python内置HTTP服务器
python -m http.server

# 或使用Node.js的http-server
npx http-server
```

3. 在浏览器中访问
```
http://localhost:8000
```

## 配置Supabase

1. 创建Supabase项目
2. 更新`utils/api.js`中的Supabase配置信息
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

## 生产环境部署

本项目已经配置为使用本地Tailwind CSS文件，而不是CDN版本，以便在生产环境中使用。

### 安装依赖

```bash
npm install
```

### 构建Tailwind CSS

```bash
# 开发环境（监视文件变化）
npm run watch-css

# 生产环境（最小化文件）
npm run build
```

### 启动开发服务器

```bash
npm run dev
```

## 数据库迁移

请参考 `migrations/README.md` 文件了解如何应用数据库迁移脚本。

## 浏览器兼容性

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)
- 移动浏览器 (iOS Safari, Android Chrome)

## 贡献

欢迎提交Pull Request或创建Issue来帮助改进项目。

## 许可证

MIT 