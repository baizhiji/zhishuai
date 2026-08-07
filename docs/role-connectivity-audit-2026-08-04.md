# 三角色数据联通审计报告

**审计日期**: 2026-08-04  
**审计范围**: Admin → Agent → Customer 三级角色间的账号创建、管理、登录、功能开通全链路  
**审计方法**: 全源码静态分析 + 端点对照验证  
**涉及代码**: server/src/routes/ (admin-agents, agent, auth, account, user-features), apk/src/services/ (auth, account, feature, api), web/services/ (agent, admin)

---

## 执行摘要

三角色数据联通整体可通但存在 4 个阻断级 Bug。管理员可以创建代理商和客户，代理商可以创建客户，被创建的账号能成功登录。但代理商无法在客户列表中看到自己创建的客户（查询条件错误），APK 端所有账号管理请求因双重 `/api/` 前缀而 404，客户可以通过自助端点覆盖上级设置的功能开关。此外还存在人员归属不一致、状态字段多处歧义、APK 无鉴权刷新等中等风险。

---

## 一、角色间账号创建与登录链路

### 1.1 Admin → Agent（管理员创建代理商）

创建端点: `POST /api/admin/agents` (auth middleware + admin role guard)

执行流程: 事务中创建 User(role='agent') + Agent 记录，生成随机密码或使用传入密码。密码使用 bcrypt 哈希后存储。Agent 与 User 通过 `Agent.userId` 一对一关联。

代理商登录: `POST /api/auth/login` with loginType='agent'。被创建的代理商使用 phone + password 登录，服务端校验 status === 'active'，生成 JWT token（含 role=agent），返回 redirect targetRole='agent'。

结论: **链路通畅**。管理员创建的代理商账号可以正常登录并使用，无阻断问题。

### 1.2 Admin → Customer（管理员直接创建客户）

创建端点: `POST /api/admin/customers` (auth middleware + admin role guard)

执行流程: 创建 User(role='customer', status='active')，如果传入 agentId 则同步创建 `UserAgentRelation` 绑定代理商，否则客户成为孤儿记录。

客户登录: `POST /api/auth/login` with loginType='user'。被创建的客户使用 phone + password 登录，服务端校验 user.role === 'customer' 且 loginType === 'user'，status === 'active'，生成 token。

**发现问题**:
- 管理员可以创建无 agentId 的客户，这些客户不属于任何代理商，无代理商可管理
- 管理员创建客户时未设置 expireAt（过期时间），永久有效

Web 端登录后跳转到 `/customer/dashboard`，APK 端登录后进入主界面。

结论: **链路通畅，但孤儿客户风险存在**。建议要求创建客户时必须指定 agentId 或明确"直属平台"。

### 1.3 Agent → Customer（代理商创建客户）

创建端点: `POST /api/agent/customers` (auth middleware + agent role guard)

执行流程: 创建 User(role='customer', status='active') + `UserAgentRelation(userId, agentId)`。密码为传入 password 或 phone 后 6 位作为默认密码。Agent 只能创建 role='customer' 的用户，被 `roleSchema` 严格约束。

客户登录: 同上 `POST /api/auth/login` with loginType='user'。完全一致。

**发现问题**:
- 默认密码为 phone.slice(-6)，这是一个简单可预测的弱密码，存在安全风险
- 返回密码为明文（密码在创建接口响应中原样返回），需加密传输

结论: **链路通畅但创建响应暴露明文密码**。登录正常。

---

## 二、阻断级 Bug（4项）

### Bug #1 [阻断] Agent 客户列表查询条件错误

文件: `server/src/routes/agent.ts`，GET /api/agent/customers

当前代码使用 `prisma.user.findMany({ where: { agentId: agentId } })`。

问题: User 模型没有显式 `agentId` 字段。Agent 创建的客户通过 `UserAgentRelation` 表关联，而非直接 `agentId` 外键。统计端点 (`/api/agent/statistics`) 和客户详情端点 (`GET /api/agent/customers/:id`) 都正确使用了 `agentRelation: { agentId }` 查询，唯独列表端点使用了错误的 `agentId` 字段。

影响: 代理商打开客户列表时，返回的数据实际上仅包含代理商自己的 User 记录（Agent 与 User 一对一关联的关系记录），而非其名下的客户列表。如果不存在这条关联记录，则列表始终为空。代理商无法在 UI 上看到和管理自己创建的客户。

### Bug #2 [阻断] APK 双重 /api/ 前缀导致所有账号管理请求 404

文件: `apk/src/services/account.service.ts` + `apk/src/services/api.config.ts`

`api.config.ts` 中 BASE_URL = `http://43.129.16.148:3001/api`（末尾已含 `/api`）。
`account.service.ts` 中所有请求路径均以 `/api/` 开头（如 `/api/account/info`、`/api/account/staff` 等）。

拼接后实际请求: `http://43.129.16.148:3001/api/api/account/info` → 404。

影响范围: 账号信息获取、使用统计、使用记录、订阅信息、套餐列表、员工管理（增删改查）全部不可用。所有失败自动降级到硬编码的假数据兜底，用户表面看不到错误但展示的始终是写死的数据（如"USR001、138****8000、2025-12-31"）。

其他 APK 服务不受影响: auth.service 使用 `/auth/login` 无 `/api/` 前缀，feature.service 使用 `/features/available` 无前缀，均正确。

### Bug #3 [阻断] 客户可通过自助端点覆盖上级设置的功能开关

文件: `server/src/routes/user-features.ts`，PUT /api/features/:featureCode

当前代码使用 `authenticate` 中间件（仅验证 token，无角色约束）。任何登录用户均可调用此端点切换任意功能开关，包括 admin/agent 已禁用的功能。

```typescript
// 当前实现 - 无角色限制
router.put('/:featureCode', authenticate, async (req, res) => {
  const feature = await prisma.userFeatureSwitch.upsert({
    where: { userId_featureCode: { userId: req.user.id, featureCode } },
    ...
  });
});
```

影响: 管理员或代理商为一个客户关闭了某个功能，客户可在 APK 端通过 PUT /api/features/:featureCode 自行重新启用。按需付费模式完全失效，代理商对客户的功能控制形同虚设。

### Bug #4 [阻断] 代理商冻结的客户在统计中不计数

文件: `server/src/routes/agent.ts`，GET /api/agent/statistics

```typescript
const frozenCustomers = await prisma.user.count({
  where: {
    agentRelation: { agentId },
    status: 'disabled',  // ← 错误: 应为 'frozen'
  },
});
```

代理商冻结客户时 (POST /api/agent/customers/:id/toggle-status) 设置 status 为 'frozen'，登录拦截校验 `status !== 'active'` 匹配 'frozen'。但统计查询使用 `status: 'disabled'`，无法匹配到冻结客户，导致漏斗统计数据失真。

---

## 三、高风险问题（4项）

### Issue #5 [High] PUT /account/staff/:id 无所有权校验

文件: `server/src/routes/account.ts`

任意已验证用户可通过此端点修改任意 staff 记录，无 ownership/userId 校验。攻击者可通过遍历 ID 修改他人的员工信息。应为跨租户越权漏洞。

### Issue #6 [High] 管理员可直接创建无归属客户

文件: `server/src/routes/admin-agents.ts`，POST /api/admin/customers

agentId 为可选参数，不传则创建无归属客户。无代理商可查看或管理该客户，数据管理链路断裂。建议要么必填 agentId，要么明确创建"平台直属客户"并有独立管理入口。

### Issue #7 [High] APK 无 token 刷新机制

APK 获取 token 后（7 天有效期），无 refresh token 机制。过期后用户必须重新输入密码登录。对于 APK 端长期使用的客户体验很差。服务端也无 refresh 端点。

### Issue #8 [High] APK 无角色感知路由

APK `AppNavigator.tsx` 对所有登录用户展示相同的导航结构，不区分子级 agent 角色和子级 customer 角色。APK 只支持 customer 登录（loginType 硬编码为 'user'），如果 agent 误用 APK 登录会被 loginType 校验拒绝。但内部所有页面均可见，包括管理员功能入口 "员工管理"、"数据总览" 等，客户角色用户会看到无法使用的界面。

---

## 四、中等风险问题（6项）

### Issue #9 [Medium] APK 硬编码生产 IP

文件: `apk/src/services/api.config.ts` + `apk/src/services/webLink.service.ts`
43.129.16.148 硬编码两处（API 配置 + webLink 服务）。如果服务器 IP 变更，APK 需重新发版。

### Issue #10 [Medium] APK 所有服务静默降级为假数据

account.service.ts 中每个方法都是 try { real API call } catch { return mock data }，网络问题或服务端异常时用户看到假数据而不知情。无错误提示，无重试按钮。

### Issue #11 [Medium] 账号状态字段存在三套词汇体系

| 来源 | 激活 | 冻结 | 禁用 |
|------|------|------|------|
| auth.ts login check | 'active' | — | — |
| admin-agents.ts 冻结代理商 | 'active' | — | 'inactive' |
| agent.ts 冻结客户 | 'active' | 'frozen' | — |
| agent.ts 统计查询 | — | — | 'disabled' (不存在) |

三套体系不统一，后续维护极易出错。

### Issue #12 [Medium] Agent 创建客户响应返回明文密码

文件: `server/src/routes/agent.ts`，POST /api/agent/customers

response 中直接返回 `password`（明文），密码应在 API 响应中剥离，只返回 phone/name/id。

### Issue #13 [Medium] Web 服务层代码重复

`web/services/agent.ts` 和 `web/services/customer.ts` 存在大量重叠的客户管理 API 调用。上一轮审计只修复了 agent.ts 的路径，但 customer.ts 中的相同错误可能仍在。

### Issue #14 [Medium] 空目录未清理

web/app/admin/ 下存在 sms/、recruitment/、settlement/ 三个空目录，是已废弃功能的残留。server/src/routes/ 中也可能有对应的已删除路由文件。

---

## 五、完整链路对照表

| # | 场景 | 创建端点 | 登录端点 | 登录验证 | 列表可见 | 功能管理 | 状态 |
|---|------|---------|---------|---------|---------|---------|------|
| 1 | Admin 创建 Agent | POST /api/admin/agents | POST /api/auth/login (loginType=agent) | role=agent, status=active | GET /api/admin/agents | PATCH status, PUT features | 通畅 |
| 2 | Admin 创建 Customer | POST /api/admin/customers | POST /api/auth/login (loginType=user) | role=customer, status=active | GET /api/admin/customers | PUT features | 可通(无agentId时为孤儿) |
| 3 | Agent 创建 Customer | POST /api/agent/customers | POST /api/auth/login (loginType=user) | role=customer, status=active | GET /api/agent/customers **Bug #1** | POST toggle-status | 列表不可见 |
| 4 | APK Customer 登录 | — | POST /api/auth/login (loginType=user 硬编码) | role=customer, status=active | — | Self-service **Bug #3** | 登录通畅，后续API不可用Bug #2 |
| 5 | Customer Web 登录 | — | POST /api/auth/login (loginType=user) | role=customer, status=active | — | Self-service **Bug #3** | 通畅 |
| 6 | Agent Web 登录 | — | POST /api/auth/login (loginType=agent) | role=agent, status=active | — | — | 通畅 |
| 7 | Admin Web 登录 | — | POST /api/auth/login (loginType=admin) | role=admin, status=active | — | — | 通畅 |
| 8 | Admin 冻结 Agent | PATCH /api/admin/agents/:id/status | blocked (status=inactive) | — | — | — | 通畅 |
| 9 | Agent 冻结 Customer | POST toggle-status | blocked (status=frozen) | — | — | — | 通畅(除Bug #4统计) |
| 10 | Customer APK 功能开关 | — | — | — | — | PUT /api/features/:code **Bug #3** | 可覆盖上级设置 |

---

## 六、结论

三条主线（Admin→Agent、Admin→Customer、Agent→Customer）中账号创建和登录验证链路基本通畅，被创建的账号可以成功登录并使用。但存在 4 个阻断级 Bug 导致实际业务场景不可用:

1. **Agent 客户列表不可见**（Bug #1）— 代理商无法管理自己的客户，这是最核心的业务阻断
2. **APK 账号管理全不可用**（Bug #2）— 客户在移动端的所有账号操作均返回假数据
3. **客户可自主启用被禁功能**（Bug #3）— 上级角色的功能管控完全失效
4. **冻结统计数量错误**（Bug #4）— 代理商仪表盘数据失真

建议优先修复 Bug #1 和 Bug #3，这两项直接破坏核心业务逻辑。Bug #2 需要统一 APK 的路径约定，影响全部 APK 用户的基础体验。

---

## 七、修复建议优先级

### 第一优先级（阻断业务）
- Bug #1: 修正 agent.ts GET /customers 查询条件为 `agentRelation: { agentId }`
- Bug #3: user-features.ts PUT 端点添加角色校验（customer 不能覆盖 admin/agent 的设置）
- Bug #4: 修正 statistics 查询中 status 为 'frozen'

### 第二优先级（影响全部用户体验）
- Bug #2: account.service.ts 去掉路径中的 `/api/` 前缀
- Issue #5: account.ts staff 端点添加 userId 校验

### 第三优先级（优化体验与安全）
- Issue #7: 添加 token refresh 机制
- Issue #8: APK 导航增加角色感知
- Issue #11: 统一 status 词汇体系
- Issue #12: 创建客户不返回明文密码
- Issue #9/#10: APK 移除硬编码和静默降级
