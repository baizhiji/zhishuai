# APK 移动端全面改造计划

## 一、当前状态评估

### 已验证的屏幕状态

**已接入真实 API（功能较完整）：**
- LoginScreen - 登录认证
- HomeScreen - 首页（功能开关动态加载 + 今日统计 + 公告）
- ProfileScreen - 我的（退出登录可用）
- RecruitmentScreen - 智能招聘（Tab: 概况/职位/候选人）
- AcquisitionScreen - 智能获客（Tab: 统计/任务/线索）
- ShareScreen - 推荐分享（Tab: 我的/码生成/数据）
- AIChatScreen (ai/) - AI对话（有真实API集成）
- AICreateCenterScreen - AI创作中心（分类展示 → 跳转详情）
- AICreateDetailScreen - AI创作详情（有完整的内容生成服务集成）

**使用硬编码 Mock 数据（需改造）：**
- DashboardScreen - 数据大盘（完全硬编码，无API调用）
- AIScreen - AI助手（setTimeout 模拟回复，需接 ai-chat.service）
- MaterialsScreen - 素材库（mock 数组，需接 materials.service）
- StatisticsScreen - 数据统计（mock 数据，需接真实API）
- CRMScreen - 客户管理（mock 数据，需接 CRM API）
- AccountOverviewScreen - 账号总览
- AccountManagementScreen - 账号绑定
- StaffManagementScreen - 员工管理
- SubscriptionScreen - 订阅管理
- MessagesScreen - 消息中心
- NotificationsScreen - 通知
- SettingsScreen - 设置
- ReferralScreen - 转介绍
- CreateScreen - 创建（旧版，可能废弃）
- MarketingScreen - 营销
- MediaFactoryScreen - 视频中心
- MediaOperationScreen - 媒体运营
- MatrixAccountScreen - 矩阵账号
- DataListScreen - 数据列表

### 缺失的屏幕（需新建）
- TicketsScreen - 工单管理
- SupportScreen - 在线客服
- LoginLogsScreen - 登录日志
- AnnouncementScreen - 系统公告
- CompanySettingsScreen - 公司信息设置
- SecuritySettingsScreen - 安全设置
- AppDownloadScreen - APP下载

### 当前导航架构
- 3 个 Bottom Tab: 首页 / AI创作 / 我的
- Stack Navigator 包含所有子页面
- 首页通过卡片网格跳转到各功能

## 二、改造目标架构

### Bottom Tabs 重构（4 Tab）
1. **首页** (HomeTab) - 数据总览 + 快捷入口
2. **AI创作** (AICreateTab) - AI创作中心（当前AIChatScreen替换）
3. **工作台** (WorkspaceTab) - 业务功能集合（招聘/获客/分享/CRM/素材）
4. **我的** (ProfileTab) - 个人中心

### 首页改造
- 数据总览：从 dashboard-stats API 获取真实数据
- 快捷入口卡片：保持当前4+2布局，新增工单、客服入口
- 公告横幅：从 announcement API 拉取
- 最近动态：内容发布状态

### AI创作改造
- 主Tab直接展示AICreateCenterScreen（分类网格）
- 点击分类 → AICreateDetailScreen
- 底部保留"AI对话"快捷入口

### 工作台改造
- 顶部Tab栏：招聘 / 获客 / 分享 / 素材 / CRM
- 各子模块复用现有Screen

### 我的改造
- 账号总览：从 account API 获取
- 新增：工单管理、在线客服、登录日志入口
- 公司信息设置、安全设置

## 三、实施步骤

### Phase 1: 基础改造（Tier 1 - 核心必改）
1. 更新 AppNavigator（4 Tab 架构）
2. DashboardScreen → 真实API + 业务线大盘
3. MaterialsScreen → materials.service
4. AIScreen → ai-chat.service（或废弃，用AIChatScreen替代）

### Phase 2: 业务功能（Tier 2）
5. StatisticsScreen → 真实API
6. RecruitmentScreen 增强
7. AcquisitionScreen 增强
8. ShareScreen 增强

### Phase 3: 新建屏幕（Tier 3）
9. TicketsScreen
10. SupportScreen
11. LoginLogsScreen
12. AnnouncementScreen

### Phase 4: 完善（Tier 4）
13. Account Screens 真实化
14. CRMScreen 真实化
15. Messages/Notifications 真实化
16. Settings 完善

## 四、服务层补充
- tickets.service.ts - 工单 CRUD
- support.service.ts - 在线客服（WebSocket或轮询）
- login-logs.service.ts - 登录日志查询
- crm.service.ts - CRM 客户管理
- announcement.service.ts - 公告查询
- dashboard-stats.service.ts - 大盘统计
