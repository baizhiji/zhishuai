# Admin 总后台全面测试报告

**测试日期**: 2026-08-08
**测试人员**: AI Assistant
**测试范围**: Admin 总后台全部 10 个页面及对应 API 端点
**测试环境**: 生产环境 https://baizhiji.net

---

## 一、测试结果总览

Admin 总后台 10 个页面全部通过测试，所有核心 API 端点返回 200，控制台 0 错误。

| 序号 | 页面名称 | 路由路径 | API 状态 | 控制台错误 | 页面渲染 | 结论 |
|------|----------|----------|----------|------------|----------|------|
| 1 | 数据总览 | /admin/dashboard | 200 | 0 | 正常 | 通过 |
| 2 | 客户管理 | /admin/tenants | 200 | 0 | 正常 | 通过 |
| 3 | 代理商管理 | /admin/agents | 200 | 0 | 正常 | 通过 |
| 4 | API 服务商 | /admin/api-providers | 200 | 0 | 正常 | 通过 |
| 5 | 系统公告 | /admin/announcement | 200 | 0 | 正常 | 通过 |
| 6 | 操作日志 | /admin/logs | 200 | 0 | 正常 | 通过 |
| 7 | 版本管理 | /admin/version | 200 | 0 | 正常 | 通过 |
| 8 | 客服配置 | /admin/support | 200 | 0 | 正常 | 通过 |
| 9 | API 统计 | /admin/api-stats | 200 | 0 | 正常 | 通过 |
| 10 | 修改密码 | /admin/settings/security | N/A | 0 | 正常 | 通过 |

---

## 二、各页面详细测试情况

### 2.1 数据总览 (Dashboard)
核心指标面板正确展示：客户总数、代理商数、API 服务商数、公告数等统计数据。客户来源 Top 代理商列表正常显示（含名称和累计缴费）。API 请求地址均为 200 响应。

### 2.2 客户管理 (Tenants)
客户列表加载正常，分页功能可用。关联请求 dashboard、agents 列表、features（功能开关定义）均正常。支持按状态筛选客户。

### 2.3 代理商管理 (Agents)
代理商列表正确展示，含名称、等级、状态、累计缴费(subTotalPaid)、客户数(_count.UserAgentRelation)等信息。分页和搜索功能可用。

### 2.4 API 服务商 (API Providers)
服务商分类列表与提供商列表均正常加载。分类查询、提供商配置等端点 200。

### 2.5 系统公告 (Announcements)
公告列表正常加载，含标题、发布时间、目标受众、状态等信息。分页正常。

### 2.6 操作日志 (Logs)
日志列表与统计接口均正常。支持按操作类型、时间范围筛选。日志记录含操作人、动作、目标、详情、IP 等信息。

### 2.7 版本管理 (Version)
版本列表正常加载。支持版本号、发布日期、更新内容等信息的展示。

### 2.8 客服配置 (Support)
客服二维码配置页面正常。支持上传/管理客服二维码图片。

### 2.9 API 统计 (API Stats)
API 使用统计页面正常。展示各 API 服务商的使用量数据。

### 2.10 修改密码 (Security Settings)
修改密码表单正确渲染，含当前密码、新密码、确认新密码三个字段，密码显示/隐藏切换按钮可用。

---

## 三、发现并修复的问题

### 问题 1：Dashboard Top Agents 字段不匹配
**严重程度**: 高（导致数据总览 API 500 错误）
**根因**: 后端代码引用了 Agent 模型中不存在的字段 `totalCustomers` 和 `totalCommission`，实际字段为 `name` 和 `totalPaid`。
**修复**: 将 Prisma select 改为 `name`、`totalPaid`，并通过分离查询 User 表获取用户名称。
**影响文件**: `server/src/routes/admin-dashboard.ts`

### 问题 2：代理商列表 Required Relation 空值错误
**严重程度**: 高（导致代理商列表 API 500 错误）
**根因**: `include: { User: { select: ... } }` 使用了 required 关系，数据库中存在无关联 User 的 Agent 记录时 Prisma 抛出异常。
**修复**: 将 `include` 改为分离查询，先查 Agent 列表，再通过 userIds 批量查 User，用 Map 组装，缺失用户显示为 null。
**影响文件**: `server/src/routes/admin-agents.ts`

### 问题 3：操作日志列表 Required Relation 空值错误
**严重程度**: 高（导致操作日志列表 API 500 错误）
**根因**: 同问题 2，`include: { User }` 在 AdminLog 存在孤立记录时报错。
**修复**: 同问题 2 策略，分离查询 User 并容错处理。
**影响文件**: `server/src/routes/admin-logs.ts`

### 问题 4：功能开关 Prisma 字段名错误
**严重程度**: 中（导致功能开关 API 500 错误）
**根因**: 代码使用 `subFeatures` 作为 Prisma include 的字段名，但 Prisma Schema 中的实际字段名是 `FeatureSubSwitch`。Prisma Client 生成的关系字段名与模型名一致，不会自动转驼峰。
**修复**: 将所有 `subFeatures` 替换为 `FeatureSubSwitch`（共 2 处）。
**影响文件**: `server/src/routes/admin-agents.ts`

### 问题 5：API 响应格式缺少 success 字段
**严重程度**: 中（导致前端 axios 拦截器拒绝响应，前端页面不渲染数据）
**根因**: 前端 `web/lib/request.ts` 的响应拦截器要求 `success: true` 或 `code: 200`，但多个 admin 路由直接返回 `{ data, pagination }` 不包含 `success: true`。
**修复**: 批量添加 `success: true` 到所有缺失的响应中，涉及代理商列表、详情、创建、删除、批量设置、客户列表、创建、删除等端点。
**影响文件**: `server/src/routes/admin-agents.ts`、`server/src/routes/admin-logs.ts`

---

## 四、代理商/客户隐私保护验证

根据业务要求，代理商和客户角色只能查看统计数据，不能查看他人具体内容。此前已修复的 agent 路由端点验证通过：

- `/api/agent/materials`: 返回 `{ totalMaterials, typeCounts }`，不暴露具体素材内容
- `/api/agent/acquisition/leads`: 返回 `{ totalLeads, statusCounts }`，不暴露客户姓名/电话/邮箱
- `/api/agent/share/records`: 返回 `{ total, dailyCounts }`（30天），不暴露具体扫码记录

---

## 五、结论

Admin 总后台全部 10 个页面功能正常，核心 API 全部 200 响应，控制台 0 错误。测试过程中发现并修复了 5 个问题（3 个高严重度、2 个中严重度），所有问题均已修复并部署到生产环境。

Admin 后台目前能够充分发挥其管理作用：管理员可查看全局数据统计、管理代理商和客户、配置 API 服务商、发布系统公告、监控操作日志、管理版本和客服配置、查看 API 使用统计以及修改密码。
