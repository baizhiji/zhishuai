# 开发日志 (Development Log)

本文件记录开发过程中的重要决策、技术债务和经验教训，帮助避免重复踩坑。

---

## 2026-06-05

### 问题：Hydration 错误反复出现

**问题描述**: React Hydration 错误导致页面无法正常渲染

**根本原因**:
1. `useAuth` 和 Navbar 组件在服务端和客户端访问了 `localStorage`
2. 服务端渲染时 `localStorage` 不存在，导致状态不一致
3. `useEffect` 在服务端不执行，但初始 state 在服务端和客户端不同

**解决方案**:
```typescript
// 添加 mounted 状态，确保只在客户端挂载后访问 localStorage
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <Loading />; // 服务端渲染时显示加载状态
}

// 之后可以安全访问 localStorage
const userData = localStorage.getItem('user');
```

**预防措施**:
- 所有使用 `localStorage` 的组件都需要 `mounted` 状态
- 避免在组件顶层直接访问 `localStorage`
- 优先使用 React Context 管理客户端状态

**关联 Commit**: `caa8f9a`

---

### 问题：菜单 Key 重复导致 React 警告

**问题描述**: `Warning: Duplicated key 'social-accounts' used in Menu`

**根本原因**: Navbar.tsx 中 `social-accounts` 在两个地方使用：
1. 父菜单项：`key: 'social-accounts'`
2. 子菜单项：也在使用

**解决方案**: 将子菜单项改为 `social-account-auth`

---

## 2026-06-04

### 问题：API 404 错误

**问题描述**: `/api/auth/login-logs` 返回 404

**根本原因**: 
1. 后端 `index.ts` 中没有挂载 `/api/auth/login-logs` 路由
2. 前端调用了后端不存在的接口

**解决方案**: 在 `server/src/routes/auth.ts` 中添加路由

**经验教训**: 
- 前后端接口定义需要提前约定
- 使用 Swagger/OpenAPI 文档

---

### 问题：重复 API 路径

**问题描述**: 前端请求 `/api/api/dashboard/stats/`

**根本原因**: 
- `.env.local` 配置了 `NEXT_PUBLIC_API_BASE_URL=https://baizhiji.net/api`
- 前端代码中也添加了 `/api` 前缀

**解决方案**: 
- 统一在一个地方添加 `/api` 前缀
- 建议在后端代理层统一处理

---

## 2026-06-01

### 技术决策：数据库表设计

**决策**: 使用 Prisma ORM 管理数据库

**理由**:
- TypeScript 原生支持
- 类型安全
- 自动迁移
- 简洁的 API

**备选方案**: 
- TypeORM: 更成熟但更复杂
- 直接 SQL: 性能更好但维护成本高

---

## 2026-05-26

### 技术债务：未完成的模块

| 模块 | 状态 | 说明 | 负责人 |
|------|------|------|--------|
| 短信服务 | 50% | 代码存在但被禁用 | 待完成 |
| 结算系统 | 30% | 框架存在，逻辑未完成 | 待完成 |
| 报表系统 | 40% | 部分功能完成 | 待完成 |
| 数字人 | 40% | 界面完成，API 对接待开发 | 待完成 |

---

## 2026-05-18

### 初始架构决策

**前端**: Next.js 14 App Router
- 理由: React Server Components 支持 SEO优化
- 状态: 适合 SaaS 应用

**后端**: Express.js
- 理由: 轻量、灵活、社区成熟
- 备选: NestJS (过度设计)

**数据库**: MySQL + Prisma
- 理由: 关系型数据适合业务系统

**APP**: React Native + Expo
- 理由: 跨平台、成本低

---

## 常见问题速查表

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Hydration 错误 | 服务端/客户端状态不一致 | 添加 `mounted` 状态 |
| API 404 | 路由未挂载 | 检查 `index.ts` |
| 端口占用 | 进程未关闭 | `killall node` |
| 编译错误 | 类型定义缺失 | 检查 `tsconfig.json` |
| 热更新失效 | 缓存问题 | `rm -rf .next` |

---

## 待办事项

### 高优先级
- [ ] 配置真实 AI API (阿里云/百度智能云)
- [ ] 完善数据库表结构
- [ ] 启用短信服务

### 中优先级
- [ ] 完成结算系统逻辑
- [ ] 添加单元测试
- [ ] 性能优化

### 低优先级
- [ ] UI 统一设计规范
- [ ] 添加 E2E 测试
- [ ] 文档完善

---

## 🔄 如何继续上次开发

### 快速开始

1. **读取开发状态**
   ```bash
   cat docs/SESSION_MEMORY.md
   ```

2. **检查待处理任务**
   ```bash
   grep "🔴\|🟡" docs/SESSION_MEMORY.md
   ```

3. **查看 Git 历史**
   ```bash
   git lg -5
   ```

4. **拉取最新代码**
   ```bash
   git pull origin main
   ```

### 继续开发流程

1. **确定任务**: 根据 `SESSION_MEMORY.md` 中的"待处理任务"
2. **查阅文档**: 查 `ISSUES.md` 看是否有相关问题记录
3. **开始开发**: 按计划进行
4. **更新记忆**: 开发完成后更新 `SESSION_MEMORY.md`
5. **提交代码**: 遵循 `.gitmessage` 格式

### 遇到新问题

1. **记录到 ISSUES.md**
2. **更新 SESSION_MEMORY.md**
3. **解决后更新状态**

---

## 📊 项目开发阶段

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 基础架构 | ✅ 完成 | 100% |
| 核心功能 | ✅ 完成 | 90% |
| API 集成 | ⚠️ 部分 | 70% |
| AI 模型 | 🔴 待配置 | 0% |
| 移动端 | ✅ 完成 | 85% |
| 部署上线 | ⚠️ 验证中 | 80% |

---

## 🎯 下一步开发重点

1. **配置真实 AI API** - 当前返回 mock 数据
2. **完善数据库表** - 确认所有表已创建
3. **启用短信服务** - 配置阿里云/腾讯云
4. **完善结算系统** - 实现分成逻辑

---

## 2026-06-05

### 决策：电商板块作为预留内容

**决策说明**: 电商板块（详情页生成、多店铺管理、自动上架等）作为预留功能，后续再开发。

**当前优先级**:
1. ⭐⭐⭐⭐⭐ 自媒体运营 - 核心业务
2. ⭐⭐⭐⭐ 智能招聘 - 核心业务
3. ⭐⭐⭐⭐ 智能获客 - 刚完成
4. ⭐⭐⭐⭐⭐ AI对话引擎 - 已完成
5. 🔒 电商板块 - **预留，暂不开发**
6. 🔒 CRM增强 - 后续迭代

**影响范围**:
- `web/app/ecommerce/page.tsx` - 标记为预留
- `web/app/marketing/page.tsx` - 标记为预留


---

## 2026-06-05 下午

### 完成：CRM和数字人功能完善

**CRM模块新增：**
- 租户端客户管理页面 (`/customer/crm`)
- 公海池页面 (`/customer/crm/public-pool`)
- 后端API支持客户CRUD、跟进记录、公海池管理

**数字人模块新增：**
- 声音克隆API (`/api/digital-human/voice-clone`)
- 视频克隆API (`/api/digital-human/videos`)
- 数据模型：`VoiceClone`、`VideoClone`
- WEB端数字人页面增强
- APK端数字人页面完善

**Bug修复：**
- 批量修复 Next.js TypeScript 类型错误
- 修复 API 响应 `.data` 访问问题
- 修复 request.get params 类型定义
- 简化 apiAdapter.ts 移除 mock API
- 修复多个 services 文件泛型参数

