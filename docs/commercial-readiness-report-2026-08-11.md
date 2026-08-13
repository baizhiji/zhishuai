# 智枢AI 客户端商用标准检测报告

**检测日期**: 2026-08-11
**检测范围**: Web 前端 (Next.js 14) + 后端 API (Express 4 + Prisma)
**服务器**: 腾讯云CVM香港 150.109.60.130
**检测人**: CodeBuddy AI 自动化检测

---

## 综合评分: 62/100 (未达标)

| 维度 | 得分 | 权重 | 加权 | 状态 |
|------|------|------|------|------|
| 编译质量 | 40/100 | 25% | 10.0 | 严重不合格 |
| 安全防护 | 45/100 | 30% | 13.5 | 严重不合格 |
| 功能正确性 | 85/100 | 20% | 17.0 | 基本合格 |
| 性能与稳定性 | 65/100 | 15% | 9.8 | 需改进 |
| 代码规范 | 70/100 | 10% | 7.0 | 需改进 |

**结论: 尚未达到商用交付标准，存在 5 项阻断级问题和 4 项高风险问题需要在交付客户前修复。**

---

## 一、阻断级问题 (Must Fix Before Launch)

### 1.1 前端路由无服务端鉴权 (安全-严重)

**现状**: `/admin/dashboard`、`/agent` 等受保护路由在未登录状态下返回 HTTP 200，仅通过客户端 layout 组件做 `role !== 'admin'` 检查。

**风险**: 用户可通过浏览器 DevTools 修改 localStorage 中的 `viewing_role` 绕过前端鉴权，直接访问管理后台页面（虽然后端 API 仍有 authMiddleware 保护，但页面结构、路由信息完全暴露）。

**修复建议**: 在 Next.js `middleware.ts` 中添加服务端路由守卫，检查 JWT cookie 有效性，未登录用户重定向到 `/login`。

### 1.2 安全响应头完全缺失 (安全-严重)

**现状**: 服务器响应不包含任何安全头:
- 缺少 `Content-Security-Policy`
- 缺少 `X-Frame-Options`
- 缺少 `X-Content-Type-Options`
- 缺少 `Strict-Transport-Security`
- 缺少 `Referrer-Policy`
- 缺少 `Permissions-Policy`

**风险**: 容易遭受 XSS、Clickjacking、MIME sniffing 等攻击。

**修复建议**: 在 Next.js 配置或 Nginx 层面添加安全响应头。

### 1.3 前端代码中使用服务端 API Key (安全-严重)

**现状**: `web/app/api/ai/generate-script/route.ts` 中直接引用 `process.env.DASHSCOPE_API_KEY` 和 `process.env.TOKENHUB_API_KEY`。虽然这些是 Next.js API Route (服务端代码)，但 Next.js 构建时如果 tree-shaking 不当可能泄露到客户端 bundle。

**风险**: API Key 可能被打包进客户端 JS。

**修复建议**: 将 AI 调用逻辑完全移至 server/ 后端，前端 API Route 仅做代理转发，不在 web/ 目录下直接使用 API Key。

### 1.4 86 个 TypeScript 编译错误 (代码质量-严重)

**Web 端 55 个错误，主要分布在**:
- `app/customer/ai-factory/page.tsx`: 11个 — ContentCategory 枚举不完整、ContentTypeSlug 类型不匹配
- `lib/ai/factory-service.ts`: 10个 — 缺失类型定义 (ModelInfoType)、属性访问错误
- `app/customer/ai-chat/page.tsx`: 1个 — TextAreaRef 类型不匹配
- `components/shared/PasswordModal.tsx`: 1个 — 导入错误
- `components/shared/useLogoutConfirm.tsx`: 1个 — 导入错误
- `app/customer/tickets/page.tsx`: 3个 — Ticket 类型不匹配
- `app/customer/materials/page.tsx`: 3个 — Material 类型不匹配
- 其他类型断言、Record<> 转换问题若干

**Server 端 31 个错误，全部集中在**:
- `src/routes/admin-agents.ts`: 14个 — Prisma 关系名不一致 (UserAgentRelation 应为 agentRelations, User 应为 user, Agent 应为 agent)
- `src/services/admin-agents.service.ts`: 7个 — 同上 Prisma 关系名问题
- `src/routes/agent.ts`: 10个 — 混合 UserAgentRelation/UserFeatureSwitch/agentQueryUserId

**风险**: 类型错误可能导致运行时崩溃，部分路由可能在特定数据场景下返回 500。

### 1.5 缺乏健康检查端点 (运维-严重)

**现状**: `/api/v1/health` 返回 404，无任何健康检查机制。

**风险**: PM2 无法准确判断服务健康状态，负载均衡器/监控系统无法进行探活检测。

**修复建议**: 添加 `GET /api/v1/health` 端点，返回数据库连接状态和基本服务信息。

---

## 二、高风险问题 (Should Fix Before Launch)

### 2.1 Zod 输入验证覆盖率极低

**现状**: server 路由中仅 3 处使用了 Zod 验证，绝大多数 API 端点依赖 Prisma 的类型安全和手动检查。

**受影响路由 (无 Zod 验证)**: 大部分 CRUD 端点缺少请求体 schema 验证，依赖隐式的 Prisma 类型约束。

**修复建议**: 对所有公开 API 的请求体添加 Zod schema 验证，特别是 create/update 操作。

### 2.2 Prisma Schema 命名不一致

**现状**: server 代码中大量使用了与 Prisma schema 定义不匹配的关系名，如 `UserAgentRelation` (应为 `agentRelations`)、`User` include (应为 `user`)、`Agent` where (应为 `agent`)。

**影响**: 导致 31 个 TypeScript 编译错误，虽然 Prisma 在 JavaScript 运行时可以容忍部分命名差异，但类型安全性完全丧失。

### 2.3 zhishuai-web 进程重启 113 次

**现状**: PM2 显示 `zhishuai-web` 已重启 113 次，`zhishuai-api` 重启 13 次。正常运行情况下，生产服务不应有如此频繁的重启。

**可能原因**: 内存泄漏导致 OOM 被 PM2 自动重启、代码异常未捕获、Next.js 构建产物不稳定。

**修复建议**: 查看 PM2 日志 `pm2 logs zhishuai-web --lines 100`，定位重启原因。添加未捕获异常处理器。

### 2.4 viewing_role 存储在 localStorage

**现状**: 前端使用 `localStorage.getItem('viewing_role')` 来管理管理员模拟其他角色的功能。localStorage 可被用户轻易修改。

**风险**: 用户可修改自己的 viewing_role 绕过前端权限检查（虽然后端仍有 authMiddleware，但部分页面内容可能基于 role 做条件渲染）。

**修复建议**: viewing_role 应从服务端 session/JWT 中读取，而非 localStorage。

---

## 三、需改进项 (Should Fix In Next Sprint)

### 3.1 无 Content Security Policy

缺少 CSP 头意味着对 XSS 攻击没有任何HTTP层面的防护。

### 3.2 无 Rate Limiting 证据

未在代码中发现 express-rate-limit 或类似限流中间件，API 端点易受暴力破解和 DDoS。

### 3.3 错误页面缺失

404 页面返回默认 Next.js 错误页，无自定义 404/500 页面。

### 3.4 无自动化测试

项目中 `__tests__/integration/login.test.tsx` 存在但引用缺失的 `react-router-dom` 依赖，测试套件不可运行。

### 3.5 npm 依赖安全审计无法执行

服务器端缺少 `package-lock.json`，`npm audit` 无法运行。

---

## 四、达标项

- 三种角色登录验证均返回 HTTP 200 (admin/agent/customer)
- 后端 API 路由 authMiddleware 覆盖良好，大部分需鉴权路由已添加
- 错误处理 (try/catch) 覆盖较全 (1052 处)
- Prisma schema 格式合法
- 基础页面 200 响应正常 (/、/login)
- PM2 进程管理正常，CPU 使用率 0%，内存占用合理 (web 107MB, api 59MB)
- 代码中 TODO/FIXME 仅 2 处，技术债务较低

---

## 五、修复优先级与工时估算

| 优先级 | 问题 | 预估工时 | 责任端 |
|--------|------|---------|--------|
| P0 | Next.js 服务端路由守卫 | 4h | Web |
| P0 | 安全响应头配置 | 2h | Web/Nginx |
| P0 | API Key 移至后端 | 3h | Web+Server |
| P0 | 86个TS错误修复 | 12h | Web+Server |
| P0 | 健康检查端点 | 1h | Server |
| P1 | Zod 输入验证 | 8h | Server |
| P1 | Prisma 关系名修正 | 4h | Server |
| P1 | PM2 频繁重启排查 | 4h | DevOps |
| P1 | viewing_role Session化 | 3h | Web+Server |
| P2 | CSP 策略配置 | 2h | Web |
| P2 | Rate Limiting | 2h | Server |
| P2 | 自定义错误页 | 2h | Web |
| P2 | 测试修复与添加 | 8h | Web+Server |
| P2 | 依赖安全审计 | 1h | DevOps |

**总计预估: ~56 工时 (约 7 人天)**

---

## 六、总结

智枢AI 的核心业务功能基本可用，三种角色登录和基础流程正常。但在安全防护、类型安全、运维健康检查三个维度存在阻断级缺陷。

**不建议现在交付客户使用。** 至少需要完成全部 5 项 P0 阻断级问题修复 (预估 22 工时) 后，才能达到最低商用标准。若要达到较好的用户体验和安全水平，建议同步完成 P1 高风险修复 (预估 19 工时)。

建议先集中修复 P0 问题，然后进行一次完整的回归测试，确认无新增问题后再交付。
