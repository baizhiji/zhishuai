# 开发环境配置

## 环境要求
- Node.js: >= 18.0.0 (推荐 v20 LTS)
- npm: >= 9.0.0
- TypeScript: >= 5.3.0

## 项目结构
```
zhishuai/
├── web/          # Next.js 前端
├── server/       # Express 后端
├── apk/          # React Native APP
├── docs/         # 开发文档
└── scripts/      # 工具脚本
```

## 开发命令

### 前端开发
```bash
cd web
npm run dev          # 开发模式
npm run build        # 生产构建
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 代码格式化
```

### 后端开发
```bash
cd server
npm run dev          # 开发模式 (nodemon)
npm run build        # TypeScript 编译
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 代码格式化
```

### APP 开发
```bash
cd apk
npm start            # Expo 开发服务器
npm run android      # Android 开发
npm run build:android # Android 构建
```

## 代码规范

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型:**
- feat: 新功能
- fix: Bug 修复
- docs: 文档变更
- style: 代码格式
- refactor: 重构
- perf: 性能优化
- test: 测试相关
- chore: 构建/工具

**示例:**
```
feat(auth): 添加短信验证码登录

- 添加发送验证码接口
- 添加验证码校验逻辑
- 支持阿里云和腾讯云短信

Closes #123
```

### 分支管理
- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `hotfix/*`: 热修复分支

### 工作流程
1. 从 `develop` 创建功能分支
2. 开发完成后提交 PR
3. 代码审查通过后合并
4. 定期从 `develop` 合并到 `main`

## 开发进度跟踪

### CHANGELOG.md
每次重要更新后更新此文件，记录：
- 新增功能
- 修复的问题
- 废弃的功能
- 已知问题

### DEVELOPMENT_LOG.md
记录开发过程中的重要决策和技术债务：
- 为什么做某个技术选择
- 遇到的问题和解决方案
- 待办事项和后续计划
- API 设计决策

### 问题修复记录
每次修复问题时记录：
- 问题描述
- 根本原因
- 解决方案
- 预防措施

## 常用工具

### 数据库
```bash
# Prisma Studio (数据库可视化)
cd server
npx prisma studio

# 数据库迁移
npx prisma migrate dev

# 生成 Prisma Client
npx prisma generate
```

### 日志查看
```bash
# 实时日志
tail -f /app/work/logs/bypass/dev.log

# 错误日志
grep -i error /app/work/logs/bypass/dev.log | tail -50
```

### Nginx
```bash
# 检查配置
sudo nginx -t

# 重启
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

## 环境变量

### Server (.env)
```env
DATABASE_URL=mysql://user:pass@host:3306/db
PORT=3001
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=https://baizhiji.net
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### APK (app.json)
```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "https://baizhiji.net/api"
    }
  }
}
```

## 常见问题

### 端口占用
```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

### 清理缓存
```bash
# 前端清理
cd web
rm -rf .next
npm run dev

# 后端清理
cd server
rm -rf dist
npm run build
```

### Git 冲突
```bash
# 暂存本地更改
git stash

# 拉取远程
git pull origin main

# 恢复本地更改
git stash pop
```
