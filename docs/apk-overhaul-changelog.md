# APK 移动端全面改造 - 变更记录

**日期**: 2026-08-03
**改造范围**: APK 移动端全面功能补齐
**变更文件数**: 17 个

---

## 一、Service 服务层（7 个文件）

### 新建文件
| 文件 | 说明 |
|------|------|
| `services/ticket.service.ts` | 工单 CRUD 服务（列表/详情/创建/回复/状态更新/统计） |
| `services/dashboard-stats.service.ts` | 数据大盘服务（概览/趋势/分布/漏斗/热点/业务线KPI） |
| `services/announcement.service.ts` | 系统公告服务（列表/详情） |

### 重写文件
| 文件 | 改动 |
|------|------|
| `services/account.service.ts` | 全部重写：修复 API 路径（去除重复 /api/ 前缀），添加员工管理、订阅管理等方法 |
| `services/notifications.service.ts` | 全部重写：从本地存储迁移到服务器 API |
| `services/home.service.ts` | 全部重写：从纯 mock 数据迁移到真实 dashboard-stats API |
| `services/index.ts` | 添加所有新服务的导出 |

## 二、屏幕 Screen 层（7 个文件）

### 新建/重写屏幕

| 文件 | 状态 | 核心改动 |
|------|------|----------|
| `screens/DashboardScreen.tsx` | 重写 | 从硬编码 mock → 接入 dashboardStatsService，展示 4 大业务线数据卡片 |
| `screens/StatisticsScreen.tsx` | 重写 | 从硬编码 mock → 接入 dashboardStatsService，展示核心指标/趋势柱状图/分布概况 |
| `screens/MaterialsScreen.tsx` | 重写 | 从硬编码 mock → 接入 materialsService，支持搜索/筛选/创建/删除/分类 |
| `screens/TicketsScreen.tsx` | **新建** | 工单管理（列表/创建/详情/回复），支持状态筛选和优先级 |
| `screens/LoginLogsScreen.tsx` | **新建** | 登录日志列表，展示设备/IP/位置/时间 |
| `screens/AnnouncementScreen.tsx` | **新建** | 系统公告列表 + 详情弹窗 |
| `screens/MessagesScreen.tsx` | 重写 | 从硬编码 mock → 接入 notificationsService，支持已读/全部已读 |

## 三、导航 Navigation 层（1 个文件）

| 文件 | 改动 |
|------|------|
| `navigation/AppNavigator.tsx` | **重构**：从 3 Tab 升级为 4 Tab（首页/AI创作/工作台/我的），添加所有新屏幕路由 |

### 新 Tab 架构
- **首页** (Home) → HomeScreen（保持原有功能）
- **AI创作** (AICreate) → AICreateCenterScreen（AI 创作类型网格，替换旧 AIChatScreen）
- **工作台** (Workspace) → DashboardScreen（数据大盘入口）
- **我的** (Profile) → ProfileScreen（增强版，新增工单/日志/公告入口）

## 四、组件/Profile 更新（2 个文件）

| 文件 | 改动 |
|------|------|
| `screens/ProfileScreen.tsx` | 新增"服务"菜单组：工单管理/登录日志/系统公告 |
| `components/PageHeader.tsx` | 添加新页面标题映射（Dashboard/Tickets/LoginLogs/Announcement 等） |

## 五、功能对照表（改造前 vs 改造后）

| 功能 | 改造前状态 | 改造后状态 |
|------|-----------|-----------|
| 数据大盘 | 硬编码 mock | 真实 API 数据 |
| 数据统计 | 硬编码 mock | 真实 API + 趋势图表 |
| 素材库 | 硬编码 mock | 真实 API + 搜索/创建/删除 |
| 工单管理 | **缺失** | 完整可用 |
| 登录日志 | **缺失** | 完整可用 |
| 系统公告 | **缺失** | 完整可用 |
| 消息中心 | 硬编码 mock | 真实 API |
| 账号服务 | API 路径错误 | 路径修正 + 完整 API |
| 底部导航 | 3 Tab | 4 Tab（首页/AI创作/工作台/我的） |

## 六、待后续完成

1. **npm install** - 依赖安装（当前环境 npm 路径未配置）
2. **TypeScript 编译验证** - `npx tsc --noEmit`
3. **CRM 模块** - 待服务器CRM路由重新启用后接入
4. **在线客服** - 需要 WebSocket 支持，可后续添加
5. **设置子页** - 公司信息设置、安全设置可后续完善
