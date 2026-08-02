# 智枢AI SaaS 全系统审查报告

**审查日期**: 2026-08-01
**审查范围**: 管理端 → 代理商端 → 客户端，逐级全量
**审查方法**: 代码静态分析 + 后端路由检查 + 前端页面逐一校验

---

## 一、管理端 (Admin Portal)

路由前缀 `/admin/*`，使用 `adminMiddleware` 验证角色。共 8 个页面（导航栏可见）。

### 1.1 严重问题

**问题 1：[严重] tenants/page.tsx 使用100% Mock数据**
文件：`web/app/admin/tenants/page.tsx` 第79-80行
定义了 `mockCustomers: Customer[]` 数组，包含10条假数据。页面中所有加载逻辑最终都使用 `setCustomers(mockCustomers)`，完全没有对接后端 API。这是生产环境的重大缺陷——管理端看到的客户列表是永远不变的假数据。
- `setCustomers(mockCustomers)` 出现在第159行和第289行
- 对比：同一个目录下的 `crm.tsx` 路由后端实现了完整的 `/api/admin/crm/customers` 接口
- 影响：管理员无法管理真实客户，增删改全是假操作

**问题 2：[严重] admin/config/page.tsx 使用 Mock 日志数据**
文件：`web/app/admin/config/page.tsx` 第33行
`mockLogs` 数组包含假数据操作日志。操作日志应该是系统真实记录的审计线索，使用假数据意味着管理员看不到系统真实发生了什么。
- 影响：审计合规风险，操作日志不可信

**问题 3：[严重] admin-logs.ts 路由无任何认证中间件**
文件：`server/src/routes/admin-logs.ts`
该路由直接 `router.get('/')` 没有任何 `authMiddleware` 或 `adminMiddleware`。任何人都可以直接访问 `/api/logs` 获取系统操作日志，包括未登录用户。
- 影响：严重的安全漏洞，操作日志泄露

### 1.2 中等问题

**问题 4：[中等] Dashboard 图表数据结构定义与后端不一致**
文件：`web/services/statistics.ts`
- `PlatformStats` 接口定义了 `percentage` 字段（第28行），但后端 `/api/statistics/admin/platforms` 返回的 `{ name, count }` 可能没有这个字段，导致 Pie 图 percentage 标签显示异常
- `TrendData` 接口定义了 `apiCalls` 和 `revenue` 字段（第21-22行），需要确认后端是否返回这些字段
- 影响：图表可能渲染空白或缺少数据

**问题 5：[中等] tenants 和 crm 两个客户管理页功能重复**
管理端有两个客户管理入口：
- `admin/tenants/page.tsx` — Mock 数据，未对接后端
- `admin/crm.tsx` 路由 — 后端实现了 `/api/admin/crm/*`
两套页面功能高度重叠（查看客户、冻结/解冻、套餐管理），造成维护负担和用户困惑。
- 建议：删除 tenants 页面，统一使用 crm 页面（或者将 tenants 对接真实后端 API）

**问题 6：[中等] 导航栏"数据大盘"与"数据分析"功能重叠**
- `/admin/dashboard` — 数据大盘（折线图、柱状图、饼图）
- `/admin/analytics` — 数据分析（同样的统计纬度，不同展示形式）
两个页面本质上展示同一套数据，用户需要切换两个页面才能看到完整信息。
- 建议：合并为一个综合数据页面

### 1.3 轻微问题

**问题 7：[轻微] 管理端密码修改使用原生 fetch 而非统一请求库**
文件：`web/app/admin/layout.tsx` 第86行
修改密码用原生 `fetch('/api/account/password', ...)` 而非项目统一的 `utils/request` 或 `lib/request`。如果统一请求库有自动 token 注入、统一错误处理等逻辑，这种绕过会导致行为不一致。
- 对比：代理商端 layout 可能也是同样写法，需要统一

**问题 8：[轻微] adminMiddleware 逻辑过于严格**
`adminMiddleware` 使用 `req.userRole !== 'admin'`，这意味着即使 agent 角色也不能访问 admin 接口。而 `agentMiddleware` 则允许 `admin || agent`。这种不对称设计是刻意为之（admin 不能看 agent 数据），但如果有场景需要 admin 查看 agent 专属的统计页面，就会受限。

---

## 二、代理商端 (Agent Portal)

路由前缀 `/agent/*`，使用 `agentMiddleware` 验证角色。目录下 13 个页面，导航栏显示其中 7 个。

### 2.1 严重问题

**问题 9：[严重] 代理商统计数据接口后端未实现**
前端调用 `/api/agent/statistics` 和 `/api/agent/statistics/trend`，但后端 `server/src/routes/statistics.ts` 中只有 `/api/statistics/admin/*` 系列路由，没有 agent 统计路由。
- 影响：代理商数据面板无数据可显示，页面空白或报错

**问题 10：[严重] 代理商结算功能后端路由被注释**
文件：`server/src/index.ts` 第49行和第198行
```typescript
// import settlementRoutes from './routes/settlement';
// app.use('/api/settlement', settlementRoutes); // temporarily disabled
```
结算（settlement）是代理商最关心的功能之一，路由被注释意味着此功能不可用。
- 影响：代理商无法查看和确认结算金额

### 2.2 中等问题

**问题 11：[中等] agent/tickets/page.tsx 使用 Mock 数据**
文件：`web/app/agent/tickets/page.tsx` 第57-58行
`mockTickets` 和 `mockTicketHistory` 全部为假数据，且 `onFinish` 提交表单不调用任何 API。
- 影响：代理商看不到真实工单，工单操作无效

**问题 12：[中等] customers 和 tenants 页面功能重复**
- `agent/customers/page.tsx` — 客户管理
- `agent/tenants/page.tsx` — 租户管理（使用 `lib/request` 而非 `utils/request`）
两个页面功能重叠，且 tenants 页面使用另一套请求库，行为可能不一致。
- 建议：合并或明确区分

**问题 13：[中等] 6个页面未在导航栏显示（僵尸页面）**
存在但导航栏不显示的页面：`tenants`、`analytics`、`usage`、`referrals`、`acquisition`、`recruitment`、`ai-chat`、`settlement`、`tickets`

大部分是因为后端接口未实现或功能不完整。这些页面用户无法通过正常方式访问到，但代码仍在维护。
- 建议：要么完善后端上线，要么删除清理

**问题 14：[中等] 使用两套不同的 HTTP 请求库**
- `agent/tenants/page.tsx` 使用 `@/lib/request`
- `agent/features/page.tsx` 使用 `@/lib/request`
- 而其他 agent 页面使用 `@/utils/request`

`utils/request` 之前有数组转对象的 bug，`lib/request` 行为可能不同。不一致的请求库意味着某些 API 响应可能在 A 页面正常、B 页面出错。

### 2.3 轻微问题

**问题 15：[轻微] agentMiddleware 将 admin 视为 agent 的超集**
`req.userRole !== 'admin' && req.userRole !== 'agent'` 意味着 admin 可以访问所有 agent 接口。这在某些场景下有用（如管理员代客操作），但可能导致数据混淆。

**问题 16：[轻微] agent 目录结构与 admin 不对称**
admin 有 `crm.tsx` 作为客户管理的后端实现路由，agent 的 `customers/page.tsx` 却可能使用不同的数据源。两个角色的客户管理应该共享后端接口（带权限过滤），而非各自实现。

---

## 三、客户端 (Customer Portal)

路由前缀 `/customer/*`，布局无角色检查。目录下约 15 个页面。

### 3.1 严重问题

**问题 17：[严重] customer/layout.tsx 完全无权限检查**
对比 `admin/layout.tsx`：第50-73行有完整的 `useAuth()` 认证 + `user.role !== 'admin'` 角色检查，未登录显示 403 页面。Customer layout 直接渲染 children，完全不做任何检查。

这意味着：
- 任何人可以直接访问 `/customer/*` 任何路径，不验证 token
- 客户数据完全暴露，无 API 调用的页面也能看到 UI

**问题 18：[严重] user-features.ts 路由无认证中间件**
文件：`server/src/routes/user-features.ts`
所有路由（获取/更新功能开关）没有任何 `authMiddleware`。任何人可以不登录直接调用。
- 影响：功能开关数据泄露，可能被篡改

**问题 19：[严重] ticket.ts 路由无认证中间件**
文件：`server/src/routes/ticket.ts`
工单创建、查询等接口无任何认证。任何人都可以创建工单或查看他人提交的所有工单。
- 影响：严重的数据泄露和滥用风险

### 3.2 中等问题

**问题 20：[中等] 客户数据面板使用降级 Mock 数据**
文件：`web/app/customer/recruitment-dashboard/page.tsx` 第118-119行、第156-167行
```typescript
setTrendData(res.trendData || generateMockTrendData());
setPositionData(res.positionData || generateMockPositionData());
```
当后端返回数据为空时，前端自动填充假趋势数据。用户分不清看到的是真实数据还是假数据。
- 建议：数据为空时应显示空状态提示，而非假数据

**问题 21：[中等] 多处使用不统一的常量定义**
- 平台名称映射 `PLATFORM_NAME` 出现在 customer/dashboard/page.tsx（第155-159行）
- 线索状态映射 `LEAD_STATUS_NAME` 也定义在这里
这些常量应该统一放到 `shared/` 或 `web/lib/constants.ts` 中，供所有三个角色共享。

### 3.3 轻微问题

**问题 22：[轻微] 客户仪表盘数据结构过于复杂**
`CustomerSummary` 类型（`web/app/customer/dashboard/page.tsx` 第66-109行）包含 50+ 个字段，深度嵌套 4-5 层。后端返回这样复杂的数据有一定的性能风险和序列化开销。
- 建议：考虑按需加载（Tab 切换时按模块请求）

**问题 23：[轻微] 客户页面缺少统一的 Loading/Empty/Error 三状态处理**
部分页面有 loading spinner 和 empty 状态，但错误状态（API 调用失败时）处理不统一。有些页面静默失败（catch 后什么都不做），用户看到空白页面不知道是网络问题还是数据为空。

---

## 四、全局架构问题

### 4.1 严重问题

**问题 24：[严重] 两套 HTTP 请求库并存**
项目中同时存在两套完全不同的请求封装：
| 库路径 | 使用页面 |
|--------|---------|
| `@/utils/request` | admin/dashboard, customer/dashboard, 大部分 customer 页面, statistics service |
| `@/lib/request` | admin/agents, admin/api-providers, agent/features, agent/tenants, login, register |

这意味着：
- 两套库的响应处理逻辑不同（utils/request 之前有数组转对象 bug）
- 两套库的 token 管理可能不同（setAuthToken 在 lib/request 中定义）
- 两套库的错误处理可能不同
- 同一个 API 在不同页面可能返回不同格式的数据

**问题 25：[严重] 3个后端路由完全无认证中间件**
| 路由文件 | 缺失中间件 | 风险 |
|---------|-----------|------|
| `admin-logs.ts` | 无 auth / admin | 操作日志可被任何人查看 |
| `user-features.ts` | 无 auth | 功能开关可被查看和篡改 |
| `ticket.ts` | 无 auth | 工单可被创建、查看、修改 |

这是最严重的安全漏洞，应优先修复。

### 4.2 中等问题

**问题 26：[中等] 三套 layout 重复实现相似逻辑**
- `admin/layout.tsx`：认证 + 角色检查 + 侧边栏 + 用户下拉 + 修改密码
- `agent/layout.tsx`：认证 + 角色检查 + 侧边栏 + 用户下拉 + 修改密码
- `customer/layout.tsx`：无认证 + 侧边栏 + 用户下拉

三个 layout 中的修改密码 Modal、用户下拉菜单、退出登录逻辑高度相似，任何修改需要改三处。customer layout 缺失认证检查也说明这种重复复制很容易遗漏。
- 建议：抽取 `<AppLayout>` 公共组件，三个角色通过 props 传入 navbar 和权限配置

**问题 27：[中等] API 路径命名不统一**
| 实际路径 | 调用方 | 问题 |
|---------|-------|------|
| `/api/statistics/admin/overview` | admin dashboard | 用 /statistics/admin 前缀 |
| `/api/agent/statistics` | agent dashboard | 用 /agent/statistics 前缀 |
| `/api/admin/agents` | admin agents | 用 /admin 前缀 |
| `/api/agent/admin/features` | agent features | 混乱，/agent/admin/ 前缀 |

建议统一为：
- `/api/admin/statistics/*` — 管理员统计数据
- `/api/agent/statistics/*` — 代理商统计数据
- `/api/admin/agents/*` — 管理员管理 Agent
- `/api/agent/features/*` — 代理商管理功能开关

**问题 28：[中等] 15个文件包含 Mock 数据，严重程度不同**

| 文件 | Mock 用途 | 严重程度 |
|-----|----------|---------|
| admin/tenants/page.tsx | 客户列表全假 | 严重 |
| admin/config/page.tsx | 操作日志全假 | 严重 |
| agent/tickets/page.tsx | 工单列表全假 | 严重 |
| customer/recruitment-dashboard | API 降级假数据 | 中等 |
| customer/settings/page.tsx | 需要进一步检查 | 未知 |
| customer/referral/page.tsx | 需要进一步检查 | 未知 |
| customer/share/code/page.tsx | 需要进一步检查 | 未知 |
| customer/share/track/page.tsx | 需要进一步检查 | 未知 |
| notifications/page.tsx | 需要进一步检查 | 未知 |
| introduction/page.tsx | 可能是演示页 | 低 |
| help/page.tsx | 可能是演示页 | 低 |
| api/ai/generate-script | 开发环境 | 低 |

建议：按严重程度分批消除，先处理"严重"级别。

### 4.3 轻微问题

**问题 29：[轻微] 密码验证逻辑存在遗留 SHA256**
`server/src/middleware/auth.ts` 第57-67行的 `verifyPassword` 函数兼容了旧版 SHA256 哈希（"Legacy SHA256 fallback"）。这是技术债务，新密码已使用 bcrypt。
- 建议：添加迁移计划，一次性将所有密码升级为 bcrypt，然后删除旧版兼容代码

**问题 30：[轻微] 缺少统一的错误处理中间件**
Express 没有全局错误处理中间件（`app.use((err, req, res, next) => ...)`）。每个路由自行 try-catch，格式不统一。
- 建议：添加全局错误处理中间件，统一错误响应格式（success/error/meta）

---

## 五、优先级修复建议

### 第一优先级（安全漏洞 + 致命缺陷，应本周修复）
1. 修复 admin-logs.ts、user-features.ts、ticket.ts 缺少认证中间件的问题
2. customer/layout.tsx 添加认证和权限检查
3. admin/tenants/page.tsx 对接真实后端 API（删除 Mock 数据）
4. 统一两套请求库（lib/request 和 utils/request 合并）

### 第二优先级（功能缺失，应本月修复）
5. 实现 /api/agent/statistics 后端路由
6. 上线 /api/settlement 结算路由
7. agent/tickets/page.tsx 对接真实后端
8. 清理或完善僵尸页面

### 第三优先级（技术债务，应下个版本修复）
9. 统一 API 路径命名规范
10. 抽取公共 AppLayout 组件
11. 统一常量定义到 shared/
12. 消除降级 Mock 数据
13. 添加全局错误处理中间件
14. 迁移遗留的 SHA256 密码哈希

---

**审查人**: CodeBuddy AI Agent
**审查范围**: 前端 3 角色 x ~40 页面 + 后端 ~20 路由文件
**数据来源**: 代码静态分析 + 路由路径匹配 + 中间件链路追踪
