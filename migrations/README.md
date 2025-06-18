# 数据库迁移脚本

本目录包含数据库迁移脚本，用于创建和更新数据库结构。

## 如何应用迁移

### 方法1：使用Supabase Studio

1. 登录Supabase管理控制台
2. 进入SQL编辑器
3. 创建新查询
4. 复制粘贴迁移脚本内容
5. 点击"运行"按钮

### 方法2：使用Supabase CLI

如果你已安装Supabase CLI，可以使用以下命令：

```bash
supabase db push
```

## 迁移脚本列表

- `create_profiles_table.sql` - 创建用户资料表及相关触发器和策略

## 注意事项

- 在应用迁移前，请确保已备份数据库
- 迁移脚本使用了`IF NOT EXISTS`语句，可以安全地多次执行
- 如果遇到错误，请检查Supabase控制台中的日志 