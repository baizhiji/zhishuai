# 智枢 AI SaaS 系统 - 环境配置指南

## 一、当前环境配置

### 1.1 核心工具版本

| 工具 | 版本 | 状态 |
|------|------|------|
| Node.js | v24.13.1 | ✅ 最新 |
| npm | 11.8.0 | ✅ 最新 |
| Git | 2.43.0 | ✅ 最新 |
| pnpm | 可用 | ✅ 可用 |

### 1.2 OpenClaw 配置

**位置**: `/workspace/zhishuai/openclaw.json`

**记忆系统**:
- Provider: OpenAI
- 模型: doubao-embedding-vision-251215
- 混合搜索权重: 向量75% + 文本25%
- Workspace: `/workspace/projects/workspace`

**已安装插件**:
- coze-openclaw-plugin
- openclaw-cozeloop-trace
- openclaw-lark (飞书)
- openclaw-weixin (微信)
- wecom-openclaw-plugin (企业微信)

### 1.3 可用技能 (30+)

位于 `/skills/public/prod/`:

| 分类 | 技能 |
|------|------|
| AI 模型 | llm, embedding, volcano-ark |
| 前端 | frontend-design, shadcn-web-base-theme, ui-ux-pro-max |
| 设计 | design-style-thinking, web-design-guidelines |
| 媒体 | image-generation, video-generation, audio |
| 办公 | document-generation, pptx-generation, email |
| 数据库 | database, supabase, storage |
| 集成 | feishu-base, feishu-message, wechat-bot, wechat-official-account |
| 其他 | web-search, expo-advanced, knowledge, vercel-* |

---

## 二、已配置的记忆系统

### 2.1 OpenClaw 记忆 (会话级)

- 使用向量搜索检索历史上下文
- 自动压缩旧记忆
- 配置位置: `openclaw.json` → `agents.defaults.memorySearch`

### 2.2 项目文档记忆

```
docs/
├── DEVELOPMENT_GUIDE.md    # 开发指南
├── DEVELOPMENT_LOG.md     # 技术决策日志
├── ISSUES.md              # 问题追踪
└── system-architecture.md # 系统架构
```

### 2.3 Git 提交记录

所有代码更改必须通过 Git 提交，确保历史可追溯。

---

## 三、推荐的开发流程

### 3.1 遇到问题时

```
1. 查 docs/ISSUES.md - 是否有已知问题
2. 查 docs/DEVELOPMENT_LOG.md - 是否有相关决策记录
3. 查 Git 历史 - 是否有相关提交
4. 解决问题后更新 docs/ISSUES.md
```

### 3.2 开发新功能时

```
1. 创建功能分支: git checkout -b feature/xxx
2. 开发并测试
3. 提交: 遵循 .gitmessage 格式
4. 合并到 main 分支
```

### 3.3 发布版本时

```
1. 更新 docs/DEVELOPMENT_LOG.md
2. 更新 CHANGELOG.md
3. 创建 Git tag
4. 推送所有更改
```

---

## 四、代码质量保障

### 4.1 格式化工具

| 工具 | 命令 | 作用 |
|------|------|------|
| Prettier | `npm run format` | 自动格式化 |
| ESLint | `npm run lint` | 代码检查 |

### 4.2 VS Code 推荐插件

安装 `.vscode/extensions.json` 中的插件以获得最佳开发体验。

### 4.3 Git Hooks

已配置 pre-commit hook，自动格式化代码。

---

## 五、环境变量

### 5.1 服务器环境变量

```bash
# 在 /www/zhishuai/server/.env 中配置
DATABASE_URL="mysql://user:pass@host:port/db"
PORT=3001
JWT_SECRET=your-secret
```

### 5.2 前端环境变量

```bash
# 在 /www/zhishuai/web/.env.local 中配置
NEXT_PUBLIC_API_BASE_URL=https://baizhiji.net
```

---

## 六、快速命令

```bash
# 开发环境启动
cd /www/zhishuai
git pull origin main

# 后端
cd server && npm run build && node dist/index.js &

# 前端
cd web && npm run dev &

# 格式化代码
npm run format

# 查看状态
git status
git log --oneline -5
```

---

## 七、问题排查

### 7.1 Hydration 错误

参考 `docs/ISSUES.md` → "Hydration 错误" 章节

### 7.2 API 404 错误

1. 检查后端服务是否运行: `curl http://localhost:3001/api/health`
2. 检查 Nginx 配置
3. 检查 API 路由是否正确挂载

### 7.3 端口占用

```bash
sudo killall -9 node
lsof -i :3000 -i :3001
```
