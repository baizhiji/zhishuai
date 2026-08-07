# 智枢AI 全项目一致性检查报告

**检查日期**：2024-08-04
**检查范围**：server/（Express API 路由）、web/（Next.js 前端三条管端）、apk/（React Native 移动端）、shared/（共享类型/常量）

---

## 一、总体概况

智枢AI是一个三端（admin 管理员 / agent 代理商 / customer 客户）SaaS 系统。经过一轮功能清理（移除自媒体运营/矩阵账号、CRM、内容发布/自动回复、SMS、贴牌配置等冗余功能），当前项目整体结构较为清晰，但仍存在以下需要关注的遗留问题。

**发现统计**：2 个致命问题 | 6 个严重问题 | 8 个一般问题 | 2 个代码质量建议

---

## 二、致命问题（会导致功能不可用）

### 2.1 Agent 端「分成结算」页面可访问但后端路由已关闭

**影响范围**：`web/app/agent/settlement/` 完整页面可正常访问，导航栏也展示了"分成结算"入口。

`server/src/index.ts` 第 49-211 行：

```
// import settlementRoutes from './routes/settlement';  ← 第49行：导入已注释
...
// app.use('/api/settlement', settlementRoutes); // temporarily disabled  ← 第211行：路由已禁用
```

但前端 `web/app/agent/layout/Navbar.tsx` 仍保留了该菜单入口：

```
{ key: 'settlement', label: '分成结算', path: '/agent/settlement' }
```

前端 `web/app/agent/settlement/page.tsx` 发起三个实际 API 请求：

```
GET  /api/settlement/stats     → 500/404
GET  /api/settlement/records   → 500/404
POST /api/settlement/settle    → 500/404
```

**建议**：
- 如果分成结算功能短期不恢复：移除 Agent 导航栏中的"分成结算"菜单项，删除 `web/app/agent/settlement/page.tsx`，同时清理 Agent 设置通知页中的 `settlementPaid` / `settlementPending` 开关
- 如果计划恢复：取消注释 `server/src/index.ts` 中的 settlement 路由，确认 `server/src/routes/settlement.ts` 文件是否存在

### 2.2 Admin 端 Features（功能开关管理）路由被禁用

**影响范围**：管理员无法通过后台管理功能开关。

`server/src/index.ts` 第 123 行：

```
// app.use('/api/admin', adminFeaturesRoutes); // 暂时停用
```

但 `adminFeaturesRoutes` 在第 20 行仍有 import，且路由文件 `admin-features.ts` 存在。

前端 `web/app/admin/config/page.tsx` 显示"功能开关管理已下线"的占位提示，已将用户引导到客户管理页面。前端处理正确，但后端 import 和文件本身是残留。

**建议**：如果功能开关长期由 Agent 端客户管理接管，应注释 import、删除或移走 `admin-features.ts` 路由文件。

---

## 三、严重问题（会导致潜在错误或混淆）

### 3.1 versionRoutes 重复导入

`server/src/index.ts` 第 30-31 行：

```
// import versionRoutes from './routes/version';  ← 第30行：已注释
import versionRoutes from './routes/version';     ← 第31行：实际生效
```

同文件第 147-148 行有另一个重复注册：

```
// 版本管理 & 系统公告
// app.use('/api/version', versionRoutes); // temporarily disabled   ← 第148行：已注释
```

第 115 行是实际生效的路由注册：

```
app.use('/api/version', versionRoutes);
```

**问题**：重复 import 和重复 app.use 的注释增加了代码噪音，可能导致维护者误读。

**建议**：删除第 30 行注释掉的 import，删除第 147-148 行注释掉的 app.use。

### 3.2 statisticsRoutes 重复注册行

`server/src/index.ts` 第 110-111 行：

```
// app.use('/api/statistics', statisticsRoutes); // temporarily disabled  ← 第110行
app.use('/api/statistics', statisticsRoutes);                          ← 第111行
```

**问题**：两行代码相同，第 110 行的注释会误导维护者以为 statistics 路由处于禁用状态。

**建议**：删除第 110 行。

### 3.3 `notification.ts`（单数）路由文件未被注册

`server/src/routes/notification.ts` 文件存在，实现了通知 CRUD 接口（含 authMiddleware），但 `index.ts` 中 **未导入、未注册** 该路由文件。

当前实际生效的通知路由是 `server/src/routes/notifications.ts`（复数），通过 `notificationsRoutes` 在 `/api/notifications` 注册。

**问题**：两个文件功能可能重叠或有差异，未被注册的文件属于"死代码"，且容易让新开发者混淆。

**建议**：
- 确认两个文件的功能是否重复，保留一个
- 如果 `notification.ts` 另有不同用途（比如 admin 端的通知管理），应注册到独立路径

### 3.4 `admin-branding.ts` 路由文件未被注册

`server/src/routes/admin-branding.ts` 文件存在（包含 `/branding` 端点用于获取/更新贴牌配置），但 `index.ts` 中：

- 从未 import
- 第 126 行的注册代码被注释：`// app.use('/api/admin', adminBrandingRoutes);`
- 且注释说明"贴牌配置已删除"

**问题**：文件存在于路由目录但永远不会被执行，属于死代码。

**建议**：删除 `admin-branding.ts` 或加上 `.disabled` 后缀。

### 3.5 APK 端 SettingsScreen 引用了已删除的"矩阵账号"

`apk/src/screens/SettingsScreen.tsx` 中存在对"矩阵账号"的引用，导航到 AccountManagement 时使用了 id='matrix'。

矩阵账号功能（包括路由 `server/src/routes/matrix.ts`、前端页面、APK 服务 `matrix.service.ts`）已在之前的清理中删除。

**建议**：从 SettingsScreen 中移除矩阵账号相关导航入口。

### 3.6 SMS 短信服务：模块仍存在但路由已禁用

`server/src/index.ts` 第 23、161 行：

```
// import smsRoutes from './routes/sms';           ← 第23行：import 已注释
// app.use('/api/sms', smsRoutes); // temporarily disabled  ← 第161行：路由已禁用
```

但以下文件仍然存在并被引用：
- `server/src/services/sms.service.ts` — SMS 服务实现
- `web/services/sms.ts` — 前端 SMS API 封装
- 数据库 models：`SmsConfig`, `SmsLog`, `SmsTemplate`

`server/src/routes/sms.ts` 文件不存在（已删除），但 `server/src/services/sms.service.ts` 存在，且可能被 `auth.ts` 引用（用于登录验证码）。

如果验证码功能通过其他方式实现（比如 AI 验证），应清理 SMS 相关的残留文件。

**建议**：确认 SMS 验证码是否仍在使用，如不用则清理：`sms.service.ts`、`web/services/sms.ts`、数据库 SMS 相关表。

---

## 四、一般问题（代码整洁度 / 一致性）

### 4.1 数据库 Schema 中存在大量已废弃功能的表

Prisma Schema 中包含以下已删除功能的表：

| 表名 | 对应已删除功能 | 状态 |
|------|---------------|------|
| `MatrixAccount` | 矩阵账号管理 | 功能已完全移除 |
| `CrmCustomer` / `CrmNote` | CRM 客户管理 | 功能已完全移除 |
| `AutoReplyConfig` / `ReplyRule` / `ReplyLog` | 自动回复 | 功能已完全移除 |
| `PublishedContent` / `PublishRecord` / `PublishTemplate` | 内容发布 | 功能已完全移除 |
| `SmsConfig` / `SmsLog` / `SmsTemplate` | 短信服务 | 路由已禁用 |
| `BrandingConfig` / `BrandingPage` | 贴牌配置 | 功能已删除 |
| `SettlementRecord` | 分成结算 | 路由已禁用 |
| `ContentFactoryTemplate` | 内容工厂 | 功能已移除 |

**问题**：这些表占用了 Schema 定义和数据库空间，且可能被其他模块的关联查询意外访问。Prisma generate 也会生成对应的 TypeScript 类型。

**建议**：在 Schema 中将已确认不再需要的 model 注释掉或删除，并执行 `npx prisma db push` 同步或创建迁移脚本。

### 4.2 已删除的 server 路由文件残留

`server/src/routes/` 目录下：

| 路由文件 | 状态 | 说明 |
|---------|------|------|
| `matrix.ts` | 已删除 | ✓ 已正确清理 |
| `publish.ts` | 已删除 | ✓ 已正确清理 |
| `crm.ts` | 已删除 | ✓ 已正确清理 |
| `crm-advanced.ts` | 已删除 | ✓ 已正确清理 |
| `content-publish.ts` | 已删除 | ✓ 已正确清理 |
| `auto-reply.ts` | 已删除 | ✓ 已正确清理 |
| `sms.ts` | 已删除 | ✓ 已正确清理（但 service 文件还在） |
| `settlement.ts` | 未知 | 需确认是否删除 |
| `admin-branding.ts` | **仍存在** | 应删除或标记 .disabled |
| `notification.ts` | **仍存在** | 未被注册，死代码 |

### 4.3 APK 端存在未注册导航的屏幕组件

`apk/src/screens/` 下存在以下文件但在 `AppNavigator.tsx` 中未注册：

| 文件 | 状态 |
|------|------|
| `AIScreen.tsx` | 未注册导航 |
| `AnnouncementScreen.tsx` | 未注册导航 |
| `CreateScreen.tsx` | 未注册导航 |
| `DashboardScreen.tsx` | 未注册导航 |
| `LoginLogsScreen.tsx` | 未注册导航 |
| `MarketingScreen.tsx` | 未注册导航 |
| `TicketsScreen.tsx` | 未注册导航 |

`CRMScreen.tsx` 和 `MatrixAccountScreen.tsx` 已经正确删除。

**问题**：这些未注册的屏幕是残留还是待开发功能？如果是残留应删除；如果是待开发功能应在追踪中有明确记录。

### 4.4 APK 端 api.config.ts 中的 API 端点配置

需要检查 `apk/src/services/api.config.ts` 中的 API_BASE 和各类 API 路径是否与 server 端实际注册的路由一致。

### 4.5 shared/api/config.ts 中的模块名与实际情况不一致

`shared/api/config.ts` 中定义的模块名（如 media/ecommerce/hr/customer 等）可能不匹配当前系统实际的业务模块。需要对照实际 API 路由一一校验。

### 4.6 features 页面中的"矩阵管理"引用

`web/app/features/page.tsx` 中仍有"矩阵管理"相关的功能列表条目，但该功能已完全移除。

**建议**：从 features 列表中移除所有已删除功能的条目。

### 4.7 help 页面中的"矩阵管理教程"引用

`web/app/help/page.tsx` 中可能有矩阵管理相关的帮助教程条目。

**建议**：移除已删除功能对应的帮助内容。

### 4.8 APK 端 services 文件残留

已删除的 service 文件：
- `apk/src/services/matrix.service.ts` — 已正确删除
- `apk/src/services/publish.service.ts` — 已正确删除

需确认是否有其他 service 文件引用了已删除的功能。

---

## 五、代码质量建议

### 5.1 index.ts 中存在大量注释掉的路由代码

`server/src/index.ts` 中共有 12 行注释掉的 import 和 12 行注释掉的 app.use，涵盖：
- matrix、publish、crm、crm-advanced、sms、content-publish、auto-reply、settlement、report（已删除功能）
- adminFeaturesRoutes、adminBrandingRoutes（暂时停用）
- versionRoutes、statisticsRoutes（重复行）

**建议**：
- 已确认永久删除的功能：完全删除注释行
- 暂时停用的功能：加上 TODO 注释和计划恢复时间，或在文档中记录

### 5.2 三端功能范围一致性校验

| 功能模块 | Admin Web | Agent Web | Customer Web | APK | Server API |
|---------|-----------|-----------|-------------|-----|-----------|
| 登录/注册 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 仪表盘 | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI 工厂 | - | ✓ | ✓ | 待确认 | ✓ |
| 拓客系统 | - | ✓ | ✓ | - | ✓ |
| 素材管理 | - | ✓ | ✓ | - | ✓ |
| 数字人 | - | - | ✓ | - | ✓ |
| 语音克隆 | - | - | ✓ | - | ✓ |
| 工单系统 | - | ✓ | ✓ | 待确认 | ✓ |
| 在线客服 | ✓ | 待确认 | - | - | ✓ |
| 客户管理 | - | ✓ | - | - | ✓ |
| API 密钥 | - | ✓ | ✓ | - | ✓ |
| 分成结算 | - | **页面存在但API禁用** | - | - | **路由已禁用** |
| 分享管理 | - | ✓ | - | - | ✓ |
| 用量统计 | - | ✓ | - | - | ✓ |
| 系统设置 | ✓(部分) | ✓ | ✓ | ✓ | ✓ |
| 管理员功能(子商户/通知/公告/日志等) | ✓ | - | - | - | ✓ |

**结论**：除分成结算这个已知问题外，三端功能覆盖整体一致。

---

## 六、修复优先级建议

**第一优先级（会影响用户使用）**：
1. 处理 Agent 分成结算页面的可用性问题（删除或恢复）
2. 清理 APK SettingsScreen 中的矩阵账号残留引用

**第二优先级（代码整洁/不产生运行错误）**：
3. 删除 versionRoutes 重复 import
4. 删除 statisticsRoutes 重复注册行
5. 清理 notification.ts 和 admin-branding.ts 死代码文件
6. 清理 features/help 页面中的已删除功能引用

**第三优先级（长期维护）**：
7. 数据库 Schema 清理（关联 Prisma 迁移）
8. APK 未注册屏幕的明确（删除或完成开发）
9. shared/api/config.ts 模块名一致性
10. index.ts 注释行清理
11. SMS 服务残留全面清理
