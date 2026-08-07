# 智枢AI — 全端口菜单/页面链路审计报告

**审计日期**: 2025-08-05  
**审计范围**: Admin、Agent、Customer 三个 Web 端口 + APK 移动端

---

## 一、Admin 管理后台 — 健康 ✅

### 菜单项 (10项)
所有导航栏定义的路径均存在对应页面文件，无断链：

| 菜单项 | 路径 | 页面 |
|--------|------|------|
| 数据总览 | /admin/dashboard | ✅ |
| 租户管理 | /admin/tenants | ✅ |
| 代理商管理 | /admin/agents | ✅ |
| API 供应商 | /admin/api-providers | ✅ |
| 系统公告 | /admin/announcement | ✅ |
| 操作日志 | /admin/logs | ✅ |
| 版本管理 | /admin/version | ✅ |
| 支持管理 | /admin/support | ✅ |
| API 用量 | /admin/api-stats | ✅ |
| 修改密码 | modal → /admin/settings/security | ✅ |

### 孤儿页面 (1个)
| 路径 | 状态 | 影响 |
|------|------|------|
| /admin/config | 骨架页，按钮链接到 /admin/tenants | 无导航入口，仅通过直接URL访问 |

### 交叉引用检查
- Admin Dashboard 中引用了 `/agent/tickets` (查看工单) — 链接有效，但该角色不一定有访问权限。Admin 布局在检测到非admin角色时会重定向，所以非admin点击此处会触发403页面。

---

## 二、Agent 代理商后台 — ⚠️ 有孤儿页

### 菜单项 (6项 + 设置下拉)
所有导航栏定义的路径均存在对应页面文件：

| 菜单项 | 路径 | 页面 |
|--------|------|------|
| 数据总览 | /agent/dashboard | ✅ |
| 客户管理 | /agent/customers | ✅ |
| 用量统计 | /agent/usage | ✅ |
| 工单处理 | /agent/tickets | ✅ |
| 客服中心 | /agent/support | ✅ |
| 分成结算 | /agent/settlement | ✅ |
| 修改密码 | modal | ✅ |
| 切换账号 | modal | ✅ |
| 退出登录 | logout | ✅ |

### 孤儿页面 (5个 — 无导航入口)

以下页面文件存在，但 Agent 导航栏中没有任何菜单项可以访问到它们：

| 路径 | 依赖的后端API | API是否存在 | 严重度 |
|------|--------------|-------------|--------|
| /agent/ai-factory | 无外部API调用 | N/A | 低 |
| /agent/materials | `/api/agent/materials` | ❌ 不存在 | 高 |
| /agent/api-keys | `/api/agent/api-keys` | ❌ 不存在 | 高 |
| /agent/acquisition | `/api/agent/acquisition/stats`, `/api/agent/acquisition/leads` | ❌ 不存在 | 高 |
| /agent/share | `/api/agent/share/stats`, `/api/agent/share/records` | ❌ 不存在 | 高 |

**分析**:
- `/agent/ai-factory` 虽然在导航栏中不可见，但 Dashboard 页面有一个"AI创作工厂"快捷按钮指向它，所以并非完全不可达。该页面也不调用外部API，所以可正常使用。
- 其余4个页面 (materials, api-keys, acquisition, share) 不仅导航栏无入口，它们调用的后端API端点也不存在，即便通过直接URL访问也会报错。
- `/agent/recruitment` 已在上一步正确删除 (页面文件+空目录均已清理)。

### 额外孤儿页 (2个 — 设置子页)
| 路径 | 状态 |
|------|------|
| /agent/settings | 无导航入口，调 `/user/profile` |
| /agent/settings/notification | 无导航入口 |
| /agent/settings/security | 从设置页可访问 |

---

## 三、Customer 客户后台 — ⚠️ 有孤儿页和空目录

### 菜单项 (8项 + 设置子项)
所有导航栏定义的路径均存在对应页面文件，无断链：

| 菜单项 | 路径 | 页面 |
|--------|------|------|
| 数据总览 | /customer/dashboard | ✅ |
| AI创作工厂 | /customer/ai-factory | ✅ |
| 智能招聘 | /customer/recruitment | ✅ |
| 智能获客 | /customer/acquisition/discover | ✅ |
| 推荐分享 | /customer/share/board | ✅ |
| 内容中心 | /customer/materials | ✅ |
| 工单管理 | /customer/tickets | ✅ |
| 在线客服 | /customer/support | ✅ |
| 安全设置 | /customer/settings/security | ✅ |
| API管理 | /customer/api-keys | ✅ |
| APP下载 | /customer/settings/app-download | ✅ |
| 登录日志 | /customer/login-logs (从设置页进入) | ✅ |

### 孤儿页面 (2个 — 无导航入口也无内部引用)

| 路径 | 文件 | 内部引用 |
|------|------|----------|
| /customer/ai-chat | page.tsx + layout.tsx | 无 |
| /customer/digital-human | page.tsx + layout.tsx | 无 |

**分析**: 这两个页面有完整的页面文件，但既不在导航栏中，也不被任何其他页面链接引用。它们可能是已废弃的功能，或者是为未来功能预留的。

### 空目录 (2个 — 应清理)

| 路径 | 内容 |
|------|------|
| /customer/interview/ | 完全为空 |
| /customer/recruitment-dashboard/ | 完全为空 |

### 无根页面的路由 (2个 — 低风险)

| 路径 | 状态 |
|------|------|
| /customer/acquisition | 无根 page.tsx，如果直接访问会404。导航栏链接到 /customer/acquisition/discover 所以正常路径不受影响 |
| /customer/share | 同上，导航栏链接到 /customer/share/board |

---

## 四、APK 移动端 — 健康 ✅

### 导航栈路由 (18个屏幕)
AppNavigator 中所有 import 的屏幕文件全部存在，无断链：

| 导入 | 文件 | 状态 |
|------|------|------|
| HomeScreen | screens/HomeScreen.tsx | ✅ |
| ProfileScreen | screens/ProfileScreen.tsx | ✅ |
| LoginScreen | screens/auth/LoginScreen.tsx | ✅ |
| SettingsScreen | screens/SettingsScreen.tsx | ✅ |
| MediaOperationScreen | screens/MediaOperationScreen.tsx | ✅ |
| MaterialsScreen | screens/MaterialsScreen.tsx | ✅ |
| MessagesScreen | screens/MessagesScreen.tsx | ✅ |
| NotificationsScreen | screens/NotificationsScreen.tsx | ✅ |
| ReferralScreen | screens/ReferralScreen.tsx | ✅ |
| StatisticsScreen | screens/StatisticsScreen.tsx | ✅ |
| RecruitmentScreen | screens/RecruitmentScreen.tsx | ✅ |
| AcquisitionScreen | screens/AcquisitionScreen.tsx | ✅ |
| ShareScreen | screens/ShareScreen.tsx | ✅ |
| SupportQRScreen | screens/SupportQRScreen.tsx | ✅ |
| AICreateCenterScreen | screens/AICreateCenterScreen.tsx | ✅ |
| AICreateDetailScreen | screens/AICreateDetailScreen.tsx | ✅ |
| MediaFactoryScreen | screens/MediaFactoryScreen.tsx | ✅ |
| AI屏 (barrel) | screens/ai/index.ts → 8个子屏 | ✅ |

### 已删除的屏幕文件验证
Git 显示已删除的文件 (AIScreen, AccountManagement, AccountOverview, CRMScreen, CreateScreen, DashboardScreen, DataListScreen, MarketingScreen, MatrixAccountScreen, StaffManagementScreen, TemplateScreen 等) 在 AppNavigator 中**均无引用**，不会造成编译错误。

---

## 五、汇总

| 端口 | 菜单匹配 | 孤儿页 | 空目录 | 断链 | API缺失 | 评级 |
|------|---------|--------|--------|------|---------|------|
| Admin | ✅ 10/10 | 1 (低影响) | 0 | 0 | 0 | 🟢 健康 |
| Agent | ✅ 6/6 | 5 (4个高危) | 0 | 0 | 4 | 🟡 需修复 |
| Customer | ✅ 11/11 | 2 (低影响) | 2 | 0 | 0 | 🟡 需清理 |
| APK | ✅ 18/18 | 0 | 0 | 0 | N/A | 🟢 健康 |

### 建议操作

**高优先级**:
1. Agent 端 4 个孤儿页 (materials, api-keys, acquisition, share) 的后端API均不存在。有两个选择：
   - 方案A: 将这些页面重新加入 Agent 导航栏并实现对应的后端API
   - 方案B: 删除这4个孤儿页，因为 Agent 本就不应查看客户的商业活动数据

2. `/agent/ai-factory` 页面已可从 Dashboard 快捷按钮访问，但导航栏无入口。如果该功能是 Agent 正式功能，应加入导航栏。

**低优先级**:
3. 清理 Customer 端 2 个空目录: `customer/interview/`, `customer/recruitment-dashboard/`
4. 评估 Customer 端 2 个孤儿页 (ai-chat, digital-human) 是否应保留或删除
5. 考虑为 `/customer/acquisition` 和 `/customer/share` 添加根路由重定向，防止直接访问404
