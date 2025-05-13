# 今岭火锅店OA系统

今岭火锅店内部办公自动化系统，用于提升餐厅日常运营效率。

## 功能概述

系统包含以下核心功能模块：

- **人员管理**：员工注册、登录、权限控制
- **任务管理**：创建任务、分配任务、跟踪任务进度
- **文档管理**：上传文档、共享文档、管理文档权限
- **数据统计**：今日营业额、顾客数量、待处理任务、库存警报等

## 技术栈

- 前端：Materialize CSS (通过CSDN加速)、JavaScript ES6
- 后端：Supabase (无服务器后端)
- 数据库：PostgreSQL (由Supabase提供)
- 文件存储：Supabase Storage

## 快速开始

1. 访问系统首页 `index.html`
2. 新员工需先注册账号
3. 使用手机号和密码登录系统
4. 登录后即可使用各项功能

## 目录结构

```
├── index.html                     # 统一入口页面
├── app/                           # 应用核心目录
│   ├── auth.html                  # 认证页面（登录/注册）
│   ├── dashboard.html             # 主控制面板
│   ├── tasks.html                 # 任务管理
│   └── docs.html                  # 文档管理
├── assets/                        # 资源目录
│   ├── css/                       # CSS样式
│   │   └── app.css                # 应用样式
│   ├── js/                        # JS脚本
│   │   ├── app.js                 # 主应用脚本
│   │   ├── auth.js                # 认证脚本
│   │   ├── dashboard.js           # 仪表盘脚本
│   │   ├── tasks.js               # 任务管理脚本
│   │   └── docs.js                # 文档管理脚本
│   └── img/                       # 图片资源
└── README.md                      # 项目说明文档
```

## 开发指南

### 数据表结构

系统使用Supabase数据库，主要包含以下表：

- `profiles`：用户资料表
- `tasks`：任务表
- `documents`：文档表
- `announcements`：公告表
- `orders`：订单表
- `inventory`：库存表

### API接入

系统使用Supabase提供的API，关键配置：

- Supabase项目URL：`https://ainzxxuoweieowjyalgf.supabase.co`
- API密钥：项目中已配置

### 界面开发

- 采用Materialize CSS框架
- 移动端优先设计
- 使用CSDN加速的CDN资源

## 联系方式

- 系统管理员：管理员姓名
- 联系电话：联系电话
- 电子邮箱：电子邮箱