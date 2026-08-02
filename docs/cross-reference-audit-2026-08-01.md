# 智枢AI SaaS 需求符合性交叉审查报告

**审查日期**: 2026-08-01  
**审查范围**: 原始开发需求 vs 历次修改指令 vs 当前代码状态  
**审查方法**: 三方交叉对比——原始需求文档 → 历次修改记录（Git + enhancement_plan + 审计报告） → 当前代码实际状态  

---

## 一、总览

本次审查发现了 **12 大类、31 个子问题**，涵盖命名不一致、功能模块缺失、权限/安全缺失、数据流断裂、占位页面、API 路径不匹配等多个维度。

核心发现：**"自媒体运营"→"AI创作工厂"的改名仅完成了 30%，其余多处仍使用旧名称**；多个从原始需求或后续修改中应有的页面仍是占位符；部分路由缺少认证保护。

---

## 二、问题详细清单

### 问题 1：「自媒体运营」→「AI创作工厂」改名不完整

**依据**：enhancement_plan.md 明确记录【自媒体运营】删除换成【AI创作工厂】，Git 提交记录也有相关修改。

| 文件 | 当前状态 | 问题 |
|------|----------|------|
| `web/app/customer/layout/Navbar.tsx` | ✅ 已改为 "AI创作工厂" | 正确 |
| `web/lib/content/types.ts` | ✅ 注释为 "AI创作工厂" | 正确 |
| `web/lib/permissions/config.ts` | ✅ 注释为 "AI创作工厂" | 正确 |
| `web/components/layout/Navbar.tsx`（管理员/代理商共用Navbar） | ❌ 仍显示 "自媒体运营" | **需改为 AI创作工厂** |
| `web/components/layout/DynamicSidebar.tsx` | ❌ 仍显示 "自媒体运营" | **需改为 AI创作工厂** |
| `web/lib/permissions/index.ts`（getAllMenus） | ❌ 仍显示 "自媒体运营" | **需改为 AI创作工厂** |
| `web/stores/navigationStore.ts` | ⚠️ 注释仍写 "自媒体运营" | 注释无害但建议统一 |

**影响范围**：管理员后台和代理商后台的侧边栏菜单仍显示旧名称，客户看到的却是新名称，同一系统出现两种称呼，对新用户会造成困惑。

---

### 问题 2：Navbar.tsx 中 "自媒体运营" 子菜单与新工厂体系不匹配

**文件**：`web/components/layout/Navbar.tsx`

旧 Navbar 中 "自媒体运营" 的子菜单是：
- 内容工厂 → `/media/factory`
- 矩阵管理 → `/media/matrix`  
- 发布中心 → `/media/publish`
- 数据报表 → `/media/report`

而实际客户已使用的 "AI创作工厂" 路由是 `/customer/ai-factory`，子内容分类包括：小红书图文、图片生成、电商详情页、短视频、企业宣传视频、产品宣传视频、探店视频、真人MV视频、萌宠卡通短视频、数字人短视频、AI短剧、AI漫剧、爆款内容创意等 **13 个分类**。

**旧的 /media/* 路由体系与新的 /customer/ai-factory 路由体系完全不兼容，管理端 Navbar 指向的路径可能已经废弃或路径错误。**

---

### 问题 3：DynamicSidebar.tsx 菜单体系过时

**文件**：`web/components/layout/DynamicSidebar.tsx`

该文件定义了完整的客户菜单体系，但：
- 主菜单名仍是 "自媒体运营"
- 包含的子项如 `/media/factory`、`/media/matrix`、`/media/publish`、`/media/report`、`/media/digital-humans` 指向旧的 media 路由
- 子菜单布局与客户实际使用的 CustomerNavbar 完全不同
- "推荐分享" 中的 `/share/board`、`/share/code`、`/share/track` 路径可能与实际路由不一致

**这个 DynamicSidebar 目前是否被任何页面使用？如果没有，建议删除或标记为废弃；如果有，必须更新。**

---

### 问题 4：客户 Layout 缺少认证保护

**文件**：`web/app/customer/layout.tsx`

客户门户的 layout 仅有 14 行代码，没有任何认证检查（没有 useAuth、没有登录判断、没有角色校验）。对比管理员 layout (`web/app/admin/layout.tsx`) 和代理商 layout (`web/app/agent/layout.tsx`) 都有完整的认证和角色检查。

客户应在未登录时被重定向到登录页，而非直接看到页面内容（即使 API 会返回 401，页面 UI 仍会暴露）。

---

### 问题 5：多个 API 路由缺少 auth 中间件

**依据**：安全规则要求所有非公开端点必须验证身份。

| 路由文件 | 问题 |
|----------|------|
| `server/src/routes/user-features.ts` | 无 auth 中间件 |
| `server/src/routes/admin-logs.ts` | 无 auth 中间件 |
| `server/src/routes/ticket.ts` | 无 auth 中间件 |
| `server/src/routes/statistics.ts` | 无 auth 中间件 |
| `server/src/routes/admin-api-providers.ts` | 需确认 |
| `server/src/routes/admin-agents.ts` | 需确认 |

这些都是管理员/代理商才能访问的功能，缺少认证意味着任何人只要知道路由就可以访问。

---

### 问题 6：占位页面过多

以下页面使用了 `PlaceholderPage` 封装，没有实际功能：

| 页面对应的原始需求 | 当前状态 |
|-------------------|----------|
| 管理员租户管理 (`admin/tenants`) | 仍使用 Mock 数据（前端硬编码 3 个假租户） |
| 数据分析页 (`analytics`) | 占位 |
| 通知页 (`notifications`) | 占位 |
| 帮助中心 (`help`) | 占位 |
| 个人资料 (`profile`) | 占位 |
| 关于页 (`about`) | 占位 |
| 营销中心 (`marketing`) | 占位 |
| 电商管理 (`ecommerce`) | 占位 |

**租户管理**是企业多租户 SaaS 的核心功能，使用 Mock 数据意味着无法真正管理租户（客户/代理商的开通、停用、编辑等）。

---

### 问题 7：一些 .disabled 后缀的 API 路由被整文件禁用

`server/src/routes/` 目录下存在以下 .disabled 文件：

- `report.ts.disabled` — 数据报表
- `settlement.ts.disabled` — 分成结算
- `sms.ts.disabled` — 短信服务
- `statistics.ts.disabled` — 旧版统计
- `version.ts.disabled` — 版本管理

这些被禁用的功能中，"分成结算"是代理商门户需要的核心功能（agent Navbar 中有"分成结算"菜单），但其 API 路由被整文件禁用了。"数据报表"在多个地方都有入口。

---

### 问题 8：API 路径与前端调用不匹配（历史遗留未全部修复）

根据 bugfix-report-2026-08-01.md，之前已修复了 2 处 API 路径不匹配，但还有潜在问题：

- `web/app/admin/analytics/page.tsx` 修复后调用 `/api/statistics/admin/overview`，需确认后端是否实现了该端点
- `web/app/admin/features/page.tsx` 修复后调用 `/api/admin/features`，需确认后端路由是否正确注册

---

### 问题 9：ContentCategory 枚举与 feature 权限枚举脱节

`web/lib/permissions/config.ts` 中定义的 Permission 枚举包含 `FACTORY_XIAOHONGSHU`、`FACTORY_IMAGE` 等工厂权限，但 `content/types.ts` 中的 ContentCategory 枚举使用的是 `XIAOHONGSHU`、`IMAGE_GENERATION` 等不同命名。

两套枚举的命名不一致，无法直接映射：Permission 用 `factory.xiaohongshu`，ContentCategory 用 `xiaohongshu`。功能开关系统如何控制哪些内容分类对客户可见？

---

### 问题 10：AI Agent 中心未完成

**依据**：原始需求文档第 6 项功能 "AI Agent中心" 明确要求：
> "系统内置多个AI Agent可供选择使用，如：爆款文案助手、简历筛选助手、面试出题助手等"

当前 `web/app/customer/ai-chat/` 页面存在，但其 Agent 体系、Agent 管理后台、Agent 切换能力是否完整实现需要验证。`server/src/routes/agent.ts` 和 `server/src/routes/admin-agents.ts` 有相关后端代码，前端 admin/agents 页面也存在，需要验证端到端流程是否通畅。

---

### 问题 11：推荐分享/短视频分享码 功能不完整

**依据**：Git 提交 4f88fdc "feat:refactored referral sharing to short video sharing code"

原始需求中的"推荐分享"功能包含：
- 邀请好友
- 追踪统计（AIGC渠道码）
- 分享码生成

后来重构为"短视频分享码"。当前：
- 客户 Navbar 仍有 "推荐分享" 菜单项
- Agent Navbar 的菜单项中未包含相关菜单
- 前端页面 `/customer/share/` 存在，但后端 `server/src/routes/share.ts` 和 `server/src/routes/referral.ts` 的实现是否完整需核实

---

### 问题 12：开发需求中提到的某些功能完全没有实现

| 原始需求 | 状态 |
|----------|------|
| 社交媒体账号绑定（微信扫码登录） | 部分实现（`server/src/routes/oauth.ts` 存在但有 `.disabled` 版本） |
| 知识库管理 | 前端页面存在 (`customer/employees` 中有知识库入口），需验证 |
| 操作日志（客户侧） | 前端页面存在 `customer/login-logs/`，但 `server/src/routes/admin-logs.ts` 无 auth |
| 数据报表（客户侧） | 存在但 `report.ts` 被禁用 |
| 账号管理 - 员工管理 | 前端页面存在，`server/src/routes/employee.ts` 和后端 Service 存在 |

---

## 三、优先级建议

### P0（阻塞性问题，必须立即修复）
1. 客户 Layout 缺少认证保护（问题 4）—— 安全漏洞
2. 多个 API 路由缺少 auth 中间件（问题 5）—— 安全漏洞

### P1（用户可感知的功能缺陷，建议近期修复）
3. "自媒体运营"→"AI创作工厂"改名不完整（问题 1）—— 用户困惑
4. Navbar.tsx 旧子菜单与新工厂体系不匹配（问题 2）—— 功能断裂
5. DynamicSidebar.tsx 菜单体系过时（问题 3）—— 功能混乱
6. settlement.ts 被禁用但 agent 有"分成结算"菜单（问题 7）—— 功能断裂
7. API 路径与前端调用一致性验证（问题 8）

### P2（影响完整性的问题，建议排期修复）
8. 占位页面过多（问题 6）—— 租户管理 Mock 数据优先
9. ContentCategory 与 Permission 枚举脱节（问题 9）—— 权限体系不完整
10. AI Agent 中心验证（问题 10）
11. 推荐分享功能完整性验证（问题 11）

### P3（长期完善）
12. 未实现的需求功能（问题 12）

---

## 四、关于 DynamicSidebar.tsx 的特别说明

这个文件 `web/components/layout/DynamicSidebar.tsx` 定义了完整的客户侧边栏菜单体系，但命名和路径都是旧的。如果确认这个组件**仍被使用**（可能是通过 `/account`、`/share` 等独立路由），需要：
1. 将 "自媒体运营" 改为 "AI创作工厂"
2. 将子菜单路径从 `/media/*` 更新为 `/customer/ai-factory` 体系
3. 或者直接废弃它，统一使用 `CustomerNavbar` 组件

如果已不再使用，建议添加 `@deprecated` 注释或直接移动至 archive 目录。

---

## 五、建议的后续行动

1. **先确认我遗漏的修改指令**：你看完这份报告后，如果回忆起还有我遗漏的修改指令，请告诉我，我补充进来
2. **逐项确认优先级**：对于上述 12 类问题，你决定哪些先改、哪些后改
3. **分批执行**：建议按 P0 → P1 → P2 的顺序分批修复，每批修复后部署验证
