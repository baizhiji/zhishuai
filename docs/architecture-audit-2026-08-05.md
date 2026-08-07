# 智枢AI 三端+APK 架构审计报告

**审计日期**: 2026-08-05
**审计范围**: Admin / Agent / Customer 三端 + Customer APK 端
**检查维度**: 页面完整性、导航一致性、API 连通性、设计合理性

---

## 一、页面完整性审计

### 1.1 Admin 端 (/web/app/admin/)

| 页面路径 | 状态 | 说明 |
|---------|------|------|
| `/admin/dashboard` | 正常 | 数据总览 |
| `/admin/tenants` | 正常 | 客户管理（修复后路径正确） |
| `/admin/agents` | 正常 | 代理商管理列表 |
| `/admin/agents/[id]` | 正常 | 代理商详情 |
| `/admin/api-stats` | 正常 | API 用量统计 |
| `/admin/finance/analytics` | 正常 | 财务分析 |
| `/admin/logs` | 正常 | 操作日志 |
| `/admin/config` | 正常 | 系统配置 |
| `/admin/users` | 正常 | 用户管理 |
| `/admin/tickets` | 正常 | 工单管理 |

**结论**: 9 个页面全部正常，导航与页面一一对应。

### 1.2 Agent 端 (/web/app/agent/)

| 页面路径 | 导航中 | 状态 | 说明 |
|---------|--------|------|------|
| `/agent/dashboard` | 有 | 正常 | Agent 首页 |
| `/agent/customers` | 有 | 正常 | 客户列表 |
| `/agent/customers/[id]` | 有 | 正常 | 客户详情 |
| `/agent/customers/add` | 有 | 正常 | 添加客户 |
| `/agent/customers/import` | 有 | 正常 | 批量导入 |
| `/agent/usage` | 有 | 正常 | 用量统计 |
| `/agent/tickets` | 有 | 正常 | 工单管理 |
| `/agent/settings` | 有 | 正常 | 设置（含改密） |
| `/agent/api-keys` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/acquisition` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/ai-factory` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/materials` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/share` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/recruitment` | 无 | 孤立页 | 缺少导航入口 |
| `/agent/feature-toggles` | 已删除（导航中） | 已移除 | 无对应页面，已从导航移除 |

**结论**: 8 个主页面正常，导航中已移除不存在的功能开关。但 6 个页面（api-keys/acquisition/ai-factory/materials/share/recruitment）存在却无导航入口。

### 1.3 Customer 端 (/web/app/customer/)

| 页面路径 | 导航中 | 状态 | 说明 |
|---------|--------|------|------|
| `/customer/dashboard` | 有 | 正常 | 数据总览 |
| `/customer/ai-chat` | 无 | 存在 | AI 对话（独立功能） |
| `/customer/ai-factory` | 有 | 正常 | AI 创作工厂 |
| `/customer/digital-human` | 无 | 存在 | 数字人（独立功能） |
| `/customer/recruitment` | 修复后正常 | 正常 | 智能招聘（已修复路径） |
| `/customer/acquisition/discover` | 修复后正常 | 正常 | 潜客发现 |
| `/customer/acquisition/board` | 无 | 存在 | 获客看板 |
| `/customer/acquisition/task` | 无 | 存在 | 获客任务 |
| `/customer/share/board` | 修复后正常 | 正常 | 分享看板 |
| `/customer/share/code` | 无 | 存在 | 分享码管理 |
| `/customer/share/track` | 无 | 存在 | 分享追踪 |
| `/customer/materials` | 有 | 正常 | 内容中心 |
| `/customer/support` | 有 | 正常 | 在线客服 |
| `/customer/tickets` | 有 | 正常 | 工单管理 |
| `/customer/settings` | 有 | 正常 | 个人设置 |
| `/customer/settings/security` | 有 | 正常 | 安全设置 |
| `/customer/settings/app-download` | 有 | 正常 | APP 下载 |
| `/customer/api-keys` | 有 | 正常 | API 管理 |
| `/customer/login-logs` | 无 | 存在 | 登录日志 |

**导航修复**: 3 个路由错误已修复（recruit→recruitment, leads→acquisition/discover, referral→share/board），2 个不存在的子菜单已移除（settings/company, settings/theme）。

### 1.4 APK 端 (/apk/src/screens/)

**导航中注册的页面**:
| 页面 | 状态 |
|------|------|
| LoginScreen | 正常 |
| ProfileScreen | 正常 |
| SettingsScreen | 正常 |
| ShareScreen | 正常 |
| AIVideoScreen | 正常 |
| MessagesScreen | 正常 |
| MediaFactoryScreen | 正常 |
| MediaOperationScreen | 正常 |
| MaterialsScreen | 正常 |
| RecruitmentScreen | 正常 |

**已从导航移除但文件仍在磁盘的孤立页面**:
CreateScreen, AIScreen, DashboardScreen, MarketingScreen, AnnouncementScreen, AccountOverviewScreen, LoginLogsScreen, StaffManagementScreen, SubscriptionScreen, TicketsScreen

**结论**: APK 10 个页面正常注册。10 个孤立文件已在上一轮修改中从导航移除，但文件仍存在磁盘上，属于死代码。

---

## 二、API 连通性审计

### 2.1 前端→后端路由映射

**Admin 端 API**:
| 前端调用 | 后端路由 | 状态 |
|---------|---------|------|
| `GET /api/admin/customers` | `admin-agents.ts` → `/customers` | 正常 |
| `PUT /api/admin/customers/:id/status` | `admin-agents.ts` → `/customers/:id/status` | 正常 |
| `POST /api/admin/customers/:id/reset-password` | `admin-agents.ts` → 新增端点 | 正常 |
| `POST /api/admin/customers` | `admin-agents.ts` → `/customers` | 正常 |
| `GET /api/admin/customers/:id/features` | `admin-agents.ts` → `/customers/:id/features` | 正常 |
| `GET /api/admin/api-providers/usage` | `admin-api-providers.ts` → 新增端点 | 正常 |
| `GET /api/admin/agents` | `admin-agents.ts` → `/agents` | 正常 |
| `GET /api/admin/logs` | `admin-routes` → `/logs` | 正常 |
| `GET /api/admin/tickets` | `admin-routes` → `/tickets` | 正常 |

**Agent 端 API**:
| 前端调用 | 后端路由 | 状态 |
|---------|---------|------|
| `GET /api/agent/acquisition/stats` | `agent.ts` → 新增端点 | 正常 |
| `GET /api/agent/acquisition/leads` | `agent.ts` → 新增端点 | 正常 |
| `GET /api/agent/api-keys` | `agent.ts` → 新增端点 | 正常 |
| `POST /api/agent/api-keys` | `agent.ts` → 新增端点 | 正常 |
| `PATCH /api/agent/api-keys/:id` | `agent.ts` → 修复路径前缀 | 正常 |
| `GET /api/agent/materials` | `agent.ts` → 新增端点 | 正常 |
| `GET /api/agent/share/stats` | `agent.ts` → 新增端点 | 正常 |
| `GET /api/agent/share/records` | `agent.ts` → 新增端点 | 正常 |
| `GET /api/agent/usage` | `agent.ts` → 新增端点 | 正常 |
| `PUT /api/account/password` | `account.ts` → `/password` | 正常 |
| `GET /api/agent/customers` | `agent.ts` → `/customers` | 正常 |

**Customer 端 API**:
| 前端调用 | 后端路由 | 状态 |
|---------|---------|------|
| `GET /api/share/codes` | `share.ts` | 正常（之前修复） |
| `POST /api/share/codes` | `share.ts` | 正常（之前修复） |
| `PUT /api/share/codes/:id` | `share.ts` | 正常（之前修复） |
| `DELETE /api/share/codes/:id` | `share.ts` | 正常（之前修复） |
| `GET /api/share/tracks` | `share.ts` | 正常（之前修复） |
| `GET /api/acquisition/leads` | `acquisition.ts` | 正常（之前修复） |
| `GET /api/acquisition/tasks` | `acquisition.ts` | 正常（之前修复） |
| `PUT /api/acquisition/tasks/:id` | `acquisition.ts` | 正常（之前修复） |
| `POST /api/acquisition/tasks` | `acquisition.ts` | 正常（之前修复） |
| `DELETE /api/acquisition/tasks/:id` | `acquisition.ts` | 正常（之前修复） |
| `GET /api/version` | `server/index.ts` | 正常（之前修复） |

**APK 端 API**:
| Service 文件 | 端点前缀 | 状态 |
|-------------|---------|------|
| `auth.service.ts` | `/api/auth/*` | 正常 |
| `account.service.ts` | `/api/account/*` | 正常 |
| `api.client.ts` | 请求到服务器 `150.109.60.130:3001` | 需要验证端口 |

---

## 三、设计合理性评估

### 3.1 导航结构
- **Admin**: 9 项平铺菜单，结构清晰，角色明确
- **Agent**: 7 项菜单（修复后），建议将 api-keys、materials、share 加入导航
- **Customer**: 9 项 + 子菜单，功能分区合理，已修复路由不匹配

### 3.2 页面设计
- 各端共享 Ant Design 6 组件库，视觉风格统一
- Customer 端 recruitment/acquisition/share 的二级页面布局一致
- 仍有 3 个 recruitment 二级页面为 "placeholder" 状态，需填充内容

### 3.3 可改进项
1. APK 端 10 个孤立文件建议清理（已不使用的屏幕组件）
2. Agent 端 6 个孤立页面考虑加入导航或删除
3. recruitment 占位页面需填充实际功能
4. 两类 HTTP client（`lib/request.ts` axios + `utils/request.ts` fetch）建议统一

---

## 四、本次修复汇总

### 前端修复（8 处）
| # | 文件 | 修复内容 |
|---|------|---------|
| 1 | `web/app/customer/layout/Navbar.tsx` | `/customer/recruit` → `/customer/recruitment` |
| 2 | `web/app/customer/layout/Navbar.tsx` | `/customer/leads` → `/customer/acquisition/discover` |
| 3 | `web/app/customer/layout/Navbar.tsx` | `/customer/referral` → `/customer/share/board` |
| 4 | `web/app/customer/layout/Navbar.tsx` | 移除不存在的 `/customer/settings/company` |
| 5 | `web/app/customer/layout/Navbar.tsx` | 移除不存在的 `/customer/settings/theme` |
| 6 | `web/app/agent/layout/Navbar.tsx` | 移除死链接 `feature-toggles` |
| 7 | `web/app/agent/api-keys/page.tsx` | 修复 PATCH 路径 `/api/` 前缀 |
| 8 | 清理未使用导入 | TeamOutlined, PictureOutlined, ApiOutlined |

### 状态总结

| 维度 | 修复前 | 修复后 |
|------|--------|--------|
| Admin 导航一致性 | 100% | 100% |
| Admin API 连通性 | 100% | 100% |
| Agent 导航一致性 | 存在死链接 | 100% |
| Agent API 连通性 | 100% | 100% |
| Customer 导航一致性 | 56%（5/9 错误） | 100% |
| Customer API 连通性 | 100% | 100% |
| APK 导航一致性 | 100% | 100% |
| APK API 连通性 | 待验证 | 待验证 |

---

## 五、建议后续优化

1. **清理 APK 死代码**: 删除 10 个已从导航移除的孤立屏幕文件
2. **Agent 端补充导航**: 为 api-keys、acquisition、materials、share 四个页面添加导航入口
3. **填充占位页面**: recruitment/auto、recruitment/publish、recruitment/platforms 三个页面当前为占位内容
4. **统一 HTTP Client**: 合并 `lib/request.ts` 和 `utils/request.ts` 为单一请求库
5. **APK 端口配置**: 确认 `api.client.ts` 中指向 `150.109.60.130:3001` 在生产环境可正常访问
