# 智枢AI 系统级交叉审查报告（2026-08-25）— 含修复结果

审查范围：web/、server/、apk/、desktop-ui/、shared/ 五端全链路，聚焦跨端共用、契约冲突、易错/崩溃点。所有结论均经源码实证。

## 修复状态汇总

| 编号 | 问题 | 结论 | 状态 |
|------|------|------|------|
| A1 | desktop-ui 管理端缺 /api 前缀 | **误报**：三页均用 lib/request（自动拼 /api），路径正确 | 无需修改 |
| A2 | User.role 默认值 "user" 与三端角色冲突 | schema.prisma 默认值对齐为 "customer" | 已修复 |
| A3 | Prisma 5 个 schema 文件并存 | 删除 3 个备份，2 个活跃文件加用途注释 | 已修复 |
| B1 | desktop-ui getAgentStats 调不存在路由 | 整个 statistics.ts 均无引用，删除死代码 | 已修复 |
| B2 | apk API 双 env 独立 fallback 脱节 | BASE_URL 由 SERVER_URL 推导，单一配置入口 | 已修复 |
| B3 | 跨端 API 域名不统一 | 代码层已完备（.env.example 已说明）；部署时核对域名解析 | 部署核对 |
| B4 | shared/ 死代码、契约无单一事实源 | video-production 实际被用；删除冲突的 types/index.ts | 已修复 |

---

## A1（误报澄清）：desktop-ui 管理端路径前缀

**原结论**：agents/earnings/security 三页 API 调用缺 `/api` 前缀 → 404。

**澄清后的真相**：desktop-ui 存在两套请求层，前缀约定相反且均正确——
- `lib/request.ts`（axios）：`baseURL = API_PREFIX`（含 `/api`），调用方写相对路径 `/xxx`
- `utils/request.ts`（fetch）：`baseURL = API_ORIGIN`（域名根），调用方必须写 `/api/xxx`

- `app/admin/agents/page.tsx`、`app/admin/earnings/page.tsx`、`app/admin/settings/security/page.tsx` 均使用 `lib/request`，其 `/admin/agents`、`/admin/earnings`、`/auth/password` 拼合后为 `/api/admin/agents`、`/api/admin/earnings`、`/api/auth/password`，与 server 路由完全匹配。**三页无 404 问题。**
- server 端 `PATCH /admin/agents/:id/status` 路由存在（admin-agents.ts:239），`/api/admin/dashboard` 挂载存在。均无问题。

---

## A2（已修复）：User.role 默认值对齐

`server/prisma/schema.prisma` 的 `User.role` 默认值由 `"user"` 改为 `"customer"`，与代码基线 `schema-restore.prisma` 及 `shared/index.ts` 的 `UserRole = admin|agent|customer` 保持一致。

存量影响为零：注册（auth.ts:213 显式 `role: 'customer'`）与管理员创建代理商（admin-agents.ts:145 显式 `role: 'agent'`）均显式赋值，不依赖 DB 默认值。修复消除了未来未显式赋 role 场景落入 "user" 导致角色失配的隐患。

## A3（已修复）：Prisma schema 文件收敛

删除 3 个历史备份/遗留文件：
- `server/prisma/schema-for-fix.prisma`
- `server/prisma/schema-db.prisma`
- `server/prisma/schema.prisma.bak-orphans`

保留 2 个活跃文件并在头部注释明确用途：
- `schema.prisma`（Prisma CLI 默认入口 / 生产 db push）
- `schema-restore.prisma`（本地 generate Client 用，与代码基线匹配）

两文件均为必需：`schema-restore.prisma` 是本地 `prisma generate` 的权威基线（ChatConversation 关系名与代码一致）；`schema.prisma` 是 CLI 默认入口。二者差异已在注释中说明，防未来误删/误 push。

## B1（已修复）：删除 desktop-ui 死代码服务

`desktop-ui/services/statistics.ts` 全文件无任何 import 引用（getOverview/getTrend/getPlatformStats/getAgentStats 均无调用方；admin/dashboard 页使用 lib/request 自行实现），整个文件删除。经 tsc 验证无残留引用。

## B2（已修复）：apk API 配置单一入口

`apk/src/services/api.config.ts`：`BASE_URL` 原独立 fallback 到 `DEFAULT_SERVER_URL`，若只设 `EXPO_PUBLIC_SERVER_URL` 会指向生产。现改为由 `serverUrl`（EXPO_PUBLIC_SERVER_URL || 默认值）推导，`EXPO_PUBLIC_API_URL` 仍可单独覆盖。只配一个变量时行为一致。

## B3（部署核对项）：跨端域名

代码层已完备：`desktop-ui/.env.example` 明确 `NEXT_PUBLIC_API_BASE_URL` 桌面构建必须显式指定（如 https://baizhiji.net）；apk 默认 `api.baizhiji.net`。**部署时需核对** `baizhiji.net` 与 `api.baizhiji.net` 均解析到 150.109.60.130 且 nginx 转发一致。

## B4（已修复）：shared/ 契约收敛

- `shared/types/video-production.ts` 被 desktop-ui 真实引用（`lib/ai/video-overlay-config.ts`），shared 保留。
- 删除 `shared/types/index.ts`：无任何引用，且其 `PageResponse.list` 与 `shared/index.ts` 的 `PaginatedResult.items` 契约冲突（list vs items），是"多套分页类型"混乱的根源。
- `shared/index.ts` 头部注释更新：明确当前使用方、UserRole 权威地位、新增类型统一追加至 index.ts 的约定。

---

## 验证结果

- apk `npx tsc --noEmit`：0 错误
- desktop-ui `npx tsc --noEmit`：0 错误
- `prisma validate` schema.prisma / schema-restore.prisma：均通过
- 残留引用扫描：`services/statistics`、`shared/types/index` 均无代码引用

## 修复优先级回顾

A1 为误报无需修复；A2/A3/B1/B2/B4 本次全部落地；B3 需在部署窗口核对域名解析。
