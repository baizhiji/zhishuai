# 智枢AI 全项目一致性检查报告

**审计日期**：2026-08-03  
**审计范围**：Web admin/agent/customer 三管端 + APK 移动端 + Server 后端 + Shared 共享层  
**审计维度**：6 维度（类型定义、API 路由、RBAC 权限、Web UI 模式、APK/Web 对等性、Prisma/API 响应一致性）

---

## 一、执行摘要

本次一致性检查覆盖了智枢AI 全链路 6 大维度，发现 **致命问题 33 项、严重问题 29 项、一般问题 33 项**。致命问题主要集中在三个方面：API 路由挂载与前端调用不匹配导致大量 404（16 项）、敏感数据泄露（password 哈希多次从 API 返回）、关键路由完全无认证保护（8 项）。严重问题涉及类型定义在多个端各自独立维护、Web 三端 UI 模式不统一、APK 与 Web 功能覆盖度差距大。项目全局影响范围广，建议制定分阶段修复计划。

---

## 二、致命问题（33 项）

### 2.1 API 路由不匹配导致 404（16 项）

以下路由在 `server/src/index.ts` 中已被注释，但前端 Web/APK 仍在调用，导致对应功能不可用。

| # | 被注释路由 | 前端调用位置 | 影响功能 |
|---|-----------|------------|---------|
| 1 | `/api/crm/*` | `web/services/crm.ts`, `web/services/crm-admin.ts` | CRM 客户管理全部 404 |
| 2 | `/api/crm-advanced/*` | `web/services/crm-advanced.ts` | CRM 标签/规则/提醒 全部 404 |
| 3 | `/api/publish/*` | `web/services/api.ts`, `apk/src/services/api.config.ts` | 发布中心 全部 404 |
| 4 | `/api/matrix/*` | `apk/src/services/api.config.ts`, `apk/src/services/matrix.service.ts` | APK 矩阵账号管理 404 |
| 5 | `/api/content/*` | `web/services/api.ts` | 内容工厂 AI 批量生成 全部 404 |

以下路由是后端存在但前端路径拼写与后端不匹配。

| # | 前端调用路径 | 后端实际路径 | 文件 |
|---|------------|------------|------|
| 6 | `POST /api/auth/change-password` | `PUT /api/auth/password` | `web/services/auth.ts`, `web/app/customer/settings/security/page.tsx` |
| 7 | `PUT /api/auth/profile` | `PUT /api/auth/me` | `web/services/auth.ts` |
| 8 | `POST /api/auth/logout` | 后端无此路由 | `web/services/auth.ts`, `web/services/api.ts` |
| 9 | `/api/user/info`, `/api/user/balance` 等 | 无 `/api/user` 路由挂载 | `web/services/api.ts` |
| 10 | `/api/orders/*` | 无 `/api/orders` 路由挂载 | `web/services/api.ts` |
| 11 | `/api/accounts` | 无 `/api/accounts` 路由挂载 | `web/services/api.ts` |
| 12 | `/api/settings/api-providers` 等 | `/api/api-providers` (无 settings 前缀) | `web/services/api.ts` |
| 13 | `POST /api/agent/customers/:id/freeze` | `POST /api/agent/customers/:id/toggle-status` | `web/services/agent.ts` |
| 14 | `GET /api/agent/stats` | `GET /api/agent/statistics` | `web/services/agent.ts` |
| 15 | `GET /api/agent/customers/${id}/features` (模板字符串用了单引号) | 实际请求的字面量 `${id}` 不解析 | `web/services/customer.ts` 第70行 |
| 16 | `/api/recruitment/resumes` | 后端只有 `/api/recruitment/candidates` | `web/services/recruitment.ts` |

后端完全无对应路由但前端仍在调用：

| # | 前端调用 | 状态 |
|---|---------|------|
| 17 | `/api/recruitment/ai/parse-resume` 等 4 个 AI 路由 | 后端 recruitment.ts 无 `/ai/*` 子路由 |
| 18 | `/api/acquisition/ai/strategy` 等 8 个 AI 路由 | 后端 acquisition.ts 无 `/ai/*` 子路由 |
| 19 | `/api/recruitment/process` | 后端无此路由 |
| 20 | `/api/user/features/customer/:id` | 后端无此路由 |

### 2.2 敏感数据泄露（5 项）

多处 API 返回完整的 User 对象（含 password 哈希），可被用于离线暴力破解。

| # | 路由 | 文件:行号 |
|---|------|----------|
| 21 | `PUT /api/account` 更新用户信息 | `server/src/routes/account.ts:42-47` |
| 22 | `POST /api/account/staff` 创建员工 | `server/src/routes/account.ts:135-155` |
| 23 | Agent 客户详情（返回含 password 的完整对象） | `server/src/routes/agent.ts:226-254` |
| 24 | Agent 创建/更新/冻结客户（3个路由均返回完整 User） | `server/src/routes/agent.ts:310,343,373` |
| 25 | Admin 创建/更新/修改客户状态（3个路由均返回完整 User） | `server/src/routes/admin-agents.ts:525,546,563` |

### 2.3 路由无认证保护（8 项）

以下路由完全没有任何认证中间件保护，任何人都可以无限制访问。

| # | 路由文件 | 暴露接口 | 风险等级 |
|---|---------|---------|---------|
| 26 | `server/src/routes/admin-logs.ts` | `GET /api/admin/logs`, `GET /api/admin/logs/stats` | 任何人可读管理员操作日志(含手机号/角色/操作详情) |
| 27 | `server/src/routes/ticket.ts` | 6 个路由，通过客户端 Header 做角色判断(可伪造) | 任何人可冒充 admin 读写所有工单 |
| 28 | `server/src/routes/user-features.ts` | 7 个路由，通过 URL query `userId` 标识用户 | 任何人可读写任意用户功能开关 |
| 29 | `server/src/routes/ai-enhanced.ts` | 4 个 AI 生成接口 | 任何人可无限消耗 LLM Token/费用 |
| 30 | `server/src/routes/ai-workflow.ts` | `POST /api/ai-workflow/execute` | 任何人可执行 AI 工作流 |
| 31 | `server/src/routes/enhancement.ts` | 8 个视频增强/语音/数字人接口 | 完全公开 |
| 32 | `server/src/routes/hotspot.ts` | 3 个热点话题接口 | 完全公开 |
| 33 | `server/src/routes/version.ts` | `GET /api/version/latest` | 完全公开 |

---

## 三、严重问题（29 项）

### 3.1 类型定义全项目分裂（10 项）

`shared/` 目录完全未被任何端引用，形同死代码。各类型在 web/、server/、apk/ 中各自独立定义。

| # | 类型 | 问题 |
|---|------|------|
| 34 | User | 至少 6 个版本：`shared/types` 的 `{username, permissions}`，`shared/index` 的 `{name, status}`，`web/types/api.ts` 的 `{name, email?, status:'active'\|'inactive'\|'banned'}`，`apk/types` 的 `{nickname, actualRole, isAdmin?}`——字段差异大到跨端传递必然丢失数据 |
| 35 | Material | 3 个版本：`web/types/api.ts`、`web/services/materials.ts`、`apk/services/materials.service.ts`——type 枚举完全不同(`'text'\|'image'` vs `'title'\|'topic'\|'copywriting'`) |
| 36 | Ticket | web 有 `ticketNo` 无 `userId/assigneeId/attachments/closedAt`，apk 有后者但无 `ticketNo`；web 的 status/priority 都是 `string`，apk 用了命名枚举 |
| 37 | Platform | `shared/types` 有 13 个平台（含 doudian/meituan/boss），`web/types/api.ts` 只有 5 个且是 enum，`server/content-safety` 用 `keyof typeof PLATFORM_FORBIDDEN_WORDS` |
| 38 | API_CONFIG | 三套不同值：shared 端口 3000，web 端口 3001/IP 43.129，apk 硬编码 IP 43.129 |
| 39 | API_ENDPOINTS | 三套不同结构：shared 嵌套对象，web 大写常量，apk 扁平结构 |
| 40 | ApiResponse | shared 内部两个冲突版本 + server 联合类型 + web/apk 简单对象——前后端响应格式根本不一致 |
| 41 | 工具函数 | `formatDate`、`debounce`、`throttle` 等 12 个函数在 `shared/utils` 和 `web/utils` 完全重复 |
| 42 | shared/ 自身 | 4 个文件之间没有任何 import 关系，`shared/index.ts` 和 `shared/types/index.ts` 各自定义 ApiResponse 互不引用 |
| 43 | 核心业务类型缺失 | Ticket、Material、Order、RecruitmentPost 等核心业务类型在 shared/ 中完全没有定义 |

### 3.2 前后端字段名不匹配（6 项）

| # | 位置 | 差异 |
|---|------|------|
| 44 | `web/services/acquisition.ts` → `server/routes/acquisition.ts` | 创建任务：前端传 `{name, platform}`，后端期望 `{title, channel}` |
| 45 | `web/types/api.ts` → `RecruitmentPost` Schema | 前端有 `department`、`location`，DB 无 |
| 46 | `web/types/api.ts` → `RecruitmentResume` Schema | 前端有 `skills: string[]`、`age`、`score`，DB 无 |
| 47 | `web/types/api.ts` → `Material` Schema | 前端用 `url`、`thumbnailUrl`、`category`，DB 是 `fileUrl`、`thumbnail`、无 category |
| 48 | `web/services/social-account.ts` → DB `SocialAccount` | 前端用 `lastSyncTime`、`fans`、`expiresAt`，DB 是 `lastSyncAt`、无 fans/expiresAt |
| 49 | `web/services/agent.ts` → DB `User` | 前端用 `nickname`，DB 字段是 `name` |

### 3.3 Prisma 关联名不存在于 Schema（2 项）

| # | 问题 |
|---|------|
| 50 | `server/src/routes/agent.ts` 使用 `agentRelation` 做 where，但 Schema 中关系名是 `UserAgentRelation` |
| 51 | `server/src/routes/admin-agents.ts` 使用 `children` 和 `agentRelations`，但 Schema 中是 `other_Agent` 和 `UserAgentRelation` |

### 3.4 Web 三端 UI 模式严重不一致（5 项）

| # | 问题 |
|---|------|
| 52 | 侧边栏配色：admin/agent 深色（`#001529`），customer 白色（`token.colorBgContainer`） |
| 53 | 加载状态：admin 用 `<Spin spinning>` 包裹，agent 用提前 return，customer 用 Skeleton/loading prop——完全不统一 |
| 54 | PageContainer 分裂：`components/agent/PageContainer.tsx` 和 `components/customer/PageContainer.tsx` 95% 相同但分别维护 |
| 55 | 公告系统三套独立实现：三个 layout 各自拉取和渲染公告，类型定义完全不同 |
| 56 | HTTP 客户端三套：`lib/request.ts`(axios)、`utils/request.ts`(fetch)、`lib/api.ts`(axios 类封装)，同一页面混用 |

### 3.5 APK 与 Web 功能不对等（6 项）

| # | Web 有 → APK 无 | APK 有 → Web 无 |
|---|----------------|----------------|
| 57 | Web Agent 端分成结算（`/agent/settlement`） | APK CRM 客户管理、营销中心、员工管理 |
| 58 | Web Agent 端客户管理（`/agent/customers`） | APK 账号总览、订阅管理、矩阵账号 |
| 59 | Web Customer 招聘平台授权、智能沟通 | APK 转介绍独立页面 |
| 60 | Web Customer AI 获客策略 | APK 声音克隆、AI 剪辑 |
| 61 | Web Customer API Key 管理 | APK 媒体工厂（内容工厂/发布中心/矩阵/数据报告） |
| 62 | 招聘 API 路径不通：APK 用 `/recruitment/posts`，Web 用 `/api/recruitment/jobs` | 获客功能差距：APK 完全缺失 AI 获客能力 |

---

## 四、一般问题（33 项）

### 4.1 类型相关（8 项）

63. `LoginRequest` 在 4 个地方重复定义（完全相同但分散）
64. `UserRole` 在 `shared/index.ts` 是 enum，`web/lib/permissions/config.ts` 是重复 enum，`apk/types` 是 type 别名
65. `LoginResponse` 在 `web/types/api.ts` 缺少 `expiresIn` 字段（shared 版本有）
66. `server/src/utils/api-response.ts` 的 ApiResponse 是联合类型，与前端的简单对象格式不兼容
67. `web/types/api.ts` 的 `Customer`（获客）、`web/services/crm.ts` 的 `Customer`（CRM）、`web/services/agent.ts` 的 `Customer`（代理商管理）——三个 Customer 类型字段完全不同
68. `web/services/recruitment.ts` 的 Job 类型用 `department`、`location`，DB `RecruitmentPost` 无此字段
69. `web/types/api.ts` 的 Account 类型期望 `followerCount`，DB `MatrixAccount` 无此字段
70. `web/types/api.ts` 的 Customer（获客用）期望 `interestLevel`、`tags: string[]`，DB `AcquisitionLead` 无此字段

### 4.2 API 相关（3 项）

71. 工单状态枚举不一致：前端 web 用 `open`/`in_progress`/`resolved`/`closed`，后端用 `pending`/`processing`/`resolved`/`closed`，前端发 `status: 'open'` 后端不认
72. OAuth 双路由冗余：`/api/oauth/*` 和 `/api/social/*` 两套
73. 工单分类体系完全不同：APK 用 `question/bug/feature/complaint/other`，Web 端用 `recruitment/acquisition/media/digital_human`

### 4.3 UI 相关（7 项）

74. 退出登录文案不一致：admin 说"确定要退出当前账号吗？"，agent 说"退出后需要重新登录才能继续使用"，customer 说"退出后需要重新输入账号密码才能登录，确定继续吗？"
75. 面包屑不统一：admin 无面包屑只写 Title，agent 部分用 PageContainer 部分手写，customer 全用 PageContainer
76. 日期格式化不统一：admin 用 `toLocaleString`，agent 用 `dayjs`，有些直接展示原始字符串
77. admin 端未使用 PageContainer，直接手写标题布局
78. Card 样式常量重复定义：agent dashboard 和 agent customers 各自定义相同的 `cardBase`
79. customer dashboard Card 圆角 12px，agent dashboard Card 圆角 8px
80. customer/agent 的 ai-factory 子布局模式不一致

### 4.4 Prisma/数据库相关（7 项）

81. `server/prisma/migrations/` 目录不存在，怀疑使用 `prisma db push`（无迁移历史，生产高风险）
82. LoginLog 模型存储 token 明文（`token String @db.Text`）
83. SmsConfig 模型存储 accessKeySecret 明文
84. SocialAccount 模型存储 accessToken/refreshToken/cookies 明文
85. ApiKey 模型中 apiKey 和 secretKey 明文存储
86. employee.ts 密码重置返回 `message: '密码已重置为: 123456'`，但实际生成的是随机密码
87. Schema 中存在 4 个备份文件：`schema-db.prisma`、`schema-for-fix.prisma`、`schema-orig.prisma`、`schema-restore.prisma`

### 4.5 RBAC 相关（4 项）

88. `employee.ts` 的 `POST /employees/login` 在 `router.use(agentMiddleware)` 之后定义，导致员工登录前需要已登录
89. `account.ts` 的 `GET /packages` 无认证保护（套餐列表公开）
90. `support.ts` 的 `GET /qrcode` 无认证保护
91. `version.ts` 两个路由均无认证

### 4.6 架构相关（4 项）

92. `web/services/customer.ts` 第70行使用单引号包裹模板字符串 `${id}`，导致路径不被解析
93. `web/services/api.ts` 导入路径用相对路径 `../lib/request`，其他文件用 `@/utils/request`
94. APK 使用 `http://43.129.16.148:3001/api` 硬编码 IP 地址作为 BASE_URL
95. Schema 中同时存在 `Agent`（自引用）和 `other_Agent`（反向关联），命名不一致

---

## 五、修复优先级建议

### P0 — 立即修复（安全与功能致命）

1. 恢复所有被注释的后端路由挂载（crm、crm-advanced、publish、matrix、content）
2. 为所有无认证路由添加 authMiddleware（admin-logs、ticket、user-features、ai-enhanced、ai-workflow、enhancement、hotspot）
3. 修复 ticket.ts 从客户端 Header 读取角色的安全漏洞，改用 authMiddleware
4. 修复所有 API 返回完整 User 对象导致 password 哈希泄露（account.ts、agent.ts、admin-agents.ts）
5. 修复前端 API 路径不匹配：`/api/auth/change-password` → `/api/auth/password`、`/api/user/*` 等
6. 修复 acquisition.ts 创建任务参数 `{name, platform}` → `{title, channel}`

### P1 — 本周修复（类型统一与对等性）

7. 决定 shared/ 去留并统一类型定义到一处（至少统一 User、Material、Ticket、ApiResponse）
8. 统一 HTTP 客户端为单一实现
9. 修复 Prisma 关联名错误（agentRelation → UserAgentRelation 等）
10. 补充 APK 缺失的核心功能（分成结算、客户管理 Web 端入口）

### P2 — 迭代修复（UI 一致性与代码质量）

11. 合并 PageContainer 为单一共享组件、统一公告系统
12. 统一三端侧边栏视觉风格
13. 统一 Loading/Empty/错误处理模式
14. 清理 Prisma schema 备份文件，建立迁移历史
15. 敏感字段加密存储（token、accessKeySecret、apiKey）

---

## 六、免责声明

本报告由自动化代码分析生成，基于对代码库的静态扫描，不构成对系统安全性的保证。所有修复建议在实际实施前应由开发团队评估和验证。

---

*审计完成时间：2026-08-03 | 审计工具：CodeBuddy Code Explorer × 6 子代理并行*
