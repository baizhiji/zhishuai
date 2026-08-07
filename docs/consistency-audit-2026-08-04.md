# 智枢AI 三端一致性审计报告

**审计日期**: 2026-08-04
**审计范围**: server (Express API)、web (Next.js 14)、apk (React Native/Expo)
**审计方法**: 全量代码扫描 + 路由注册表对比 + API 端点交叉验证

---

## 执行摘要

本轮审计发现 **4 个 Critical 级运行时缺陷**、**6 个 High 级死代码残留**、**4 个 Medium 级质量不一致问题**。其中 Web 端 agent.ts 服务文件有 6 个 API 端点地址写错，代理商后台修改密码端点也指向了错误的路径，APK 的"数据列表"页面存在空引用崩溃风险。死代码方面，上次修复后仍残留 mockApi.ts 等文件引用了 30+ 个已废弃类型。整体架构一致性良好，40 个服务端路由挂载点与三端导航结构基本对齐，CRM/结算/矩阵/发布等已移除功能在三端均无残留引用。

---

## Critical 级问题（运行时崩溃/功能失效）

### 1. Web agent.ts 服务文件 API 端点写错（6 处）

文件: `web/services/agent.ts`

该文件定义了代理商后台"客户管理"页面的所有 HTTP 调用，但 6 个端点路径与服务端实际路由不匹配：

| 前端调用 | 期望的服务端路径 | 实际服务端路径 | 影响 |
|----------|-----------------|---------------|------|
| `GET /api/agent/stats` | `/api/agent/stats` | `/api/agent/statistics` | 代理商数据总览请求 404 |
| `POST /api/agent/customers/:id/freeze` | freeze 独立端点 | `/api/agent/customers/:id/toggle-status` | 冻结/解冻客户操作失败 |
| `POST /api/agent/customers/:id/unfreeze` | unfreeze 独立端点 | 同上 toggle-status | 冻结/解冻客户操作失败 |
| `GET /api/user/features` | `/api/user/features` | `/api/features` | 获取功能开关列表 404 |
| `POST /api/user/features/customer/:id` | 客户功能设置 | 不存在对等路由 | 设置单客户功能开关 404 |
| `POST /api/user/features/customer/:id/batch` | 批量客户功能 | 不存在对等路由 | 批量设置客户功能开关 404 |

根因：`/api/agent` 路由由 `server/src/routes/agent.ts` 处理，统计接口定义为 `GET /statistics`，客户状态切换为 `POST /customers/:id/toggle-status`。功能开关路由挂载在 `/api/features` 而非 `/api/user/features`。

### 2. 代理商后台修改密码端点错误

文件: `web/app/agent/layout/Navbar.tsx` 第 117 行

```typescript
const res = (await request.put('/auth/password', { ... }))
```

服务端密码修改接口为 `PUT /api/account/password`（`server/src/routes/account.ts` 第 63 行），而 `/api/auth` 路由下没有 `/password` 端点。代理商修改密码时请求会返回 404。

对比：客户后台 (`web/app/customer/layout/Navbar.tsx` 第 426 行) 使用 `PUT /api/account/password`，路径正确。APK 端 (`apk/src/services/api.config.ts`) 声明 `PUT /account/password`，配合 baseURL `/api` 同样正确映射。

### 3. APK "数据列表" 页面空引用崩溃

多个位置引用了已删除的 `DataListScreen`：

- `apk/src/navigation/AppNavigator.tsx` RootStackParamList 类型定义了 `DataList: undefined`，但 Navigator 中无对应 Screen 注册
- `apk/src/screens/MediaOperationScreen.tsx` 第 43-51 行：点击"数据列表"时执行 `navigation.navigate('DataList')`，由于无对应屏幕，React Navigation 会抛出未处理的路由异常
- `apk/src/components/PageHeader.tsx` 第 13 行：title 映射中仍包含 `'数据列表': 'DataList'`

影响：APK 端"媒体工厂"页面点击"数据列表"入口会导致应用崩溃。

### 4. APK 声明了不存在的服务端端点

文件: `apk/src/services/api.config.ts`

| APK 声明 | 服务端是否存在 |
|----------|--------------|
| `LOGOUT: '/auth/logout'` | 不存在 |
| `REFRESH_TOKEN: '/auth/refresh'` | 不存在 |

服务端 auth.ts 路由只有 login、register、send-code、me 四个端点。APK 的 logout 和 refresh 调用会在实际使用时收到 404。

---

## High 级问题（死代码残留）

### 5. playwright-bridge.ts 未挂载

`server/src/routes/playwright-bridge.ts` 文件存在但 `server/src/index.ts` 中无对应的 `app.use()` 挂载。该路由文件完全是死代码。另有 `server/src/services/playwright.service.ts` 配套服务文件也可能同样处于未使用状态。

### 6. web/app/admin/crm/ 空目录

`web/app/admin/crm/` 目录存在但目录内无任何文件（无 page.tsx、layout.tsx 等）。上次已删除了路由注册，但目录本身未被清理。Next.js 不会为该空目录生成路由（需要 page.tsx），因此不会产生 404，但属于脏目录残留。

### 7. web/types/api.ts 包含 30+ 个已废弃类型

文件: `web/types/api.ts` (325 行)

以下类型属于 CRM/结算/发布/积分等已移除功能模块，仅被 `web/services/mockApi.ts` 引用：

- Account, Platform, PublishTask — 矩阵账号和发布功能
- MaterialType, MaterialStatus, Material — 素材的旧版类型定义（与现有 materials 模块不同）
- Job, Resume, Customer (CRM版) — 招聘/CRM 旧版类型
- AcquisitionTask, AcquisitionStats, ReferralCode, ReferralRecord, ReferralStats — 获客/推荐
- OrderType, PaymentMethod, OrderStatus, SubscriptionPlan, Order — 支付/订单
- UserBalance, UserPoints — 余额/积分
- ApiProvider, Knowledge — API服务商/知识库

### 8. web/services/mockApi.ts 全量废弃

文件: `web/services/mockApi.ts` (357 行)

包含所有废弃类型的 mock 数据和方法实现（login, getMaterials, createMaterial, getJobs, createJob, getResumes, getCustomers, createCustomer, getAcquisitionStats, getReferralStats, getUserBalance, getUserPoints, getOrders 等）。当前系统中所有页面均已使用真实 API 调用，该文件无任何引用方。

### 9. web/app/admin/analytics/page.tsx 纯重定向页

该页面仅包含一个 `<Result>` 组件，提示用户跳转到 `/admin/dashboard`。功能上无害，但属于过渡性代码，建议直接通过 Next.js 的 redirect 或 next.config.js 做永久重定向，删除该页面文件。

### 10. Agent 导航栏未使用的导入

`web/app/agent/layout/Navbar.tsx` 第 8 行导入了 `DollarOutlined` 图标，但菜单项中并未使用该图标。

---

## Medium 级问题（质量/不一致）

### 11. Web 端存在两套并行 API 客户端

- `web/lib/api.ts` — 基于 axios，封装为 apiClient.get/post/put/delete
- `web/utils/request.ts` — 同样基于 axios，封装为 request.get/post/put/delete

两个客户端在代码中混用：`web/app/agent/layout/Navbar.tsx` 使用 `@/lib/request`，`web/app/customer/layout/Navbar.tsx` 使用 `@/lib/api`。统一为一个客户端可减少维护成本和混淆。

### 12. APK 硬编码远端 IP 地址

`apk/src/services/api.config.ts` 中 BASE_URL 硬编码为 `http://43.129.16.148:3001/api`。建议改为通过环境变量配置，支持开发/生产环境切换。

### 13. shared/ 目录共享类型过于精简

`shared/index.ts` 仅包含 API 响应格式、分页参数、用户基础信息、错误码四个类型。服务端的 recruitment、acquisition、materials、agent 等领域的 DTO 类型均为各端独立定义，未提取到 shared/ 中。这导致 web/services/agent.ts 中的 `Customer` 接口定义与服务端 Prisma 模型不完全一致。

### 14. 三端修改密码端点不一致

| 端 | 调用的端点 | 正确性 |
|----|-----------|--------|
| Web 客户后台 | `PUT /api/account/password` | 正确 |
| Web 代理商后台 | `PUT /auth/password` | **错误**（应为 `/api/account/password`） |
| APK | `PUT /account/password` (baseURL=/api) | 正确 |

---

## 确认一致的部分

### 服务端路由挂载（40 个路由，全部正常工作）

`server/src/index.ts` 中注册的路由与各端调用对齐，无孤儿路由：
auth, recruitment, acquisition, data-acquisition, share, materials, notifications, statistics, referral, version, ai-chat, scripts, digital-human, voice-clone, dashboard-stats, admin (agents+logs), api-providers, announcements, admin/dashboard, features, agent, hot-topics, account, employee, oauth, social, tickets, export, ai-config, ai, ai-enhanced, ai-workflow, token-stats, ai-feedback, hotspot, multimodal, enhancement, support

### 管理后台导航（admin）

10 个菜单项：数据总览、客户管理、代理商管理、API服务商、系统公告、操作日志、版本管理、客服配置、API统计、系统设置。无 CRM/结算/矩阵/品牌设置残留。

### 客户后台导航（customer）

7 个一级菜单项：数据总览、内容中心、AI创作工厂、工单管理、在线客服、登录日志、API管理；设置子菜单含公司信息/安全设置/主题设置/APP下载/退出登录。无已废弃功能残留。

### 代理商后台导航（agent）

8 个一级菜单项：数据总览、客户管理、AI创作工厂、内容中心、用量统计、工单处理、客服中心、API管理。无 CRM/结算残留。`DollarOutlined` 图标虽导入但未使用。

### APK 导航器

屏幕列表：Login、Home、DigitalHuman、MediaFactory、MediaOperation、AccountPortal、Settings。已删除 AccountManagementScreen、CRMScreen、DataListScreen、MatrixAccountScreen 的注册。

### Prisma Schema

所有已移除模型（PublishRecord、CrmCustomer、MatrixAccount、Settlement 等 15 个）已确认不存在于当前 schema 中。保留的模型（User、RecruitmentJob、RecruitmentCandidate、RecruitmentInterview、AcquisitionTask、AcquisitionLead、ShareCode、ShareRecord、Material、Notification、UserFeature、HotTopic、Agent 相关等）均有对应路由和服务。

---

## 修复建议优先级

1. **立即修复**: web/services/agent.ts 的 6 个 API 路径 + agent Navbar 密码端点 + APK DataList 空引用 + APK auth 端点
2. **本次清理**: 删除 web/services/mockApi.ts、web/types/api.ts 废弃类型段、web/app/admin/crm/ 空目录、playwright-bridge.ts
3. **后续优化**: 统一 API 客户端、APK 环境变量配置、统一密码修改端点

---

## 附录：修复清单

| 编号 | 文件 | 问题 | 优先级 |
|------|------|------|--------|
| 1 | web/services/agent.ts | 6个API路径错误 | Critical |
| 2 | web/app/agent/layout/Navbar.tsx:117 | 密码端点错误 | Critical |
| 3 | apk 多文件 | DataList空引用 | Critical |
| 4 | apk/src/services/api.config.ts | logout/refresh端点 | Critical |
| 5 | server/src/routes/playwright-bridge.ts | 未挂载死代码 | High |
| 6 | web/app/admin/crm/ | 空目录残留 | High |
| 7 | web/types/api.ts | 30+废弃类型 | High |
| 8 | web/services/mockApi.ts | 全量废弃 | High |
| 9 | web/app/admin/analytics/page.tsx | 纯重定向页 | High |
| 10 | web/app/agent/layout/Navbar.tsx:8 | 未使用导入 | Medium |
| 11 | web/lib/api.ts + web/utils/request.ts | 双客户端 | Medium |
| 12 | apk/src/services/api.config.ts | 硬编码IP | Medium |
| 13 | shared/index.ts | 类型过少 | Medium |
| 14 | 多处 | 密码端点不统一 | Medium |
