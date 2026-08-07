# 智枢AI 菜单页面对应关系完整性审计报告

审计日期: 2026-08-05

## 总体结论

所有角色（客户/代理商/管理员/游客）的导航菜单项均存在对应页面，无死链、无404。项目菜单-页面完整性：100%。

已在前一轮修复中消除了所有"功能开发中"占位页面（共9个），当前剩余的3处"敬请期待"均为产品路线图中的预留功能，属正常设计。

---

## 一、公共主站 (Main Layout)

| 菜单项 | 路由 | 页面文件 | 状态 |
|--------|------|---------|------|
| 首页 | `/` | `(main)/page.tsx` | 正常 |
| 功能介绍 | `/features` | `features/page.tsx` | 正常 |
| 价格方案 | `/pricing` | `pricing/page.tsx` | 正常 |
| 关于我们 | `/about` | `about/page.tsx` | 正常 |
| 帮助中心 | `/help` | `help/page.tsx` | 正常 |
| 登录 | `/login` | `login/page.tsx` | 正常 |
| 注册 | `/register` | `register/page.tsx` | 正常 |
| API测试 | `/api-test` | `api-test/page.tsx` | 正常 |

Footer 链接（`/features#matrix`, `/help#faq`, `/about#team` 等）均为 hash 锚点，指向已有页面。**完整无误。**

---

## 二、客户后台 (Customer Layout)

| 菜单项 | 路由 | 页面文件 | 状态 |
|--------|------|---------|------|
| 数据总览 | `/customer/dashboard` | `dashboard/page.tsx` | 正常 |
| AI创作工厂 | `/customer/ai-factory` | `ai-factory/page.tsx` | 正常（含2个预留功能） |
| 智能招聘 | `/customer/recruitment` | `recruitment/page.tsx` | 正常（已实现） |
| 智能获客 | `/customer/acquisition/discover` | `acquisition/discover/page.tsx` | 正常 |
| 推荐分享 | `/customer/share/board` | `share/board/page.tsx` | 正常 |
| 内容中心 | `/customer/materials` | `materials/page.tsx` | 正常 |
| 工单管理 | `/customer/tickets` | `tickets/page.tsx` | 正常 |
| 在线客服 | `/customer/support` | `support/page.tsx` | 正常 |
| 安全设置 | `/customer/settings/security` | `settings/security/page.tsx` | 正常 |
| API管理 | `/customer/api-keys` | `api-keys/page.tsx` | 正常 |
| APP下载 | `/customer/settings/app-download` | `settings/app-download/page.tsx` | 正常 |

客户后台侧边栏11个菜单项，全部对应已有页面。**完整无误。**

### 客户子页面（不在侧边栏但存在）

这些页面由客户内部导航访问（非侧边栏直接链接）：
- `customer/acquisition/board/page.tsx` - 获客看板
- `customer/acquisition/task/page.tsx` - 获客任务
- `customer/share/code/page.tsx` - 分享码
- `customer/share/track/page.tsx` - 分享追踪
- `customer/recruitment/publish/page.tsx` - 职位发布
- `customer/recruitment/platforms/page.tsx` - 平台管理
- `customer/recruitment/auto/page.tsx` - 自动招聘
- `customer/ai-chat/page.tsx` - AI对话
- `customer/digital-human/page.tsx` - 数字人
- `customer/login-logs/page.tsx` - 登录日志
- `customer/settings/page.tsx` - 设置主页

所有子页面均已实现，无占位页面。

---

## 三、代理商后台 (Agent Layout)

| 菜单项 | 路由 | 页面文件 | 状态 |
|--------|------|---------|------|
| 数据总览 | `/agent/dashboard` | `dashboard/page.tsx` | 正常 |
| 客户管理 | `/agent/customers` | `customers/page.tsx` | 正常 |
| 用量统计 | `/agent/usage` | `usage/page.tsx` | 正常 |
| 工单处理 | `/agent/tickets` | `tickets/page.tsx` | 正常 |
| 客服中心 | `/agent/support` | `support/page.tsx` | 正常 |
| 分成结算 | `/agent/settlement` | `settlement/page.tsx` | 正常（已实现） |

代理商侧边栏6个菜单项，全部对应已有页面。**完整无误。**

### 代理商子页面（不在侧边栏但可访问）

这些页面由代理商内部导航（仪表盘快捷入口、设置页等）访问：
- `agent/acquisition` - 获客管理
- `agent/ai-factory` - AI工厂（仪表盘快捷入口）
- `agent/api-keys` - API密钥管理
- `agent/materials` - 素材管理
- `agent/recruitment` - 招聘管理（已实现）
- `agent/share` - 分享管理
- `agent/settings` - 设置主页
- `agent/settings/notification` - 通知设置
- `agent/settings/security` - 安全设置

所有子页面均已实现，无占位页面。

---

## 四、管理员后台 (Admin Layout)

| 菜单项 | 路由 | 页面文件 | 状态 |
|--------|------|---------|------|
| 数据总览 | `/admin/dashboard` | `dashboard/page.tsx` | 正常 |
| 客户管理 | `/admin/tenants` | `tenants/page.tsx` | 正常 |
| 代理商管理 | `/admin/agents` | `agents/page.tsx` | 正常 |
| API 服务商 | `/admin/api-providers` | `api-providers/page.tsx` | 正常 |
| 系统公告 | `/admin/announcement` | `announcement/page.tsx` | 正常 |
| 操作日志 | `/admin/logs` | `logs/page.tsx` | 正常 |
| 版本管理 | `/admin/version` | `version/page.tsx` | 正常 |
| 客服配置 | `/admin/support` | `support/page.tsx` | 正常 |
| API 统计 | `/admin/api-stats` | `api-stats/page.tsx` | 正常 |
| 修改密码 | `/admin/settings/security` | `settings/security/page.tsx` | 正常 |

管理员侧边栏10个菜单项，全部对应已有页面。**完整无误。**

### 额外页面
- `admin/config/page.tsx` - 显示"功能开关管理已下线"，引导跳转至客户管理。此为正常的后台功能迁移提示，非故障页面。

---

## 五、移动端 (APK - React Native)

### 5.1 底部 Tab (3个)

| Tab | 组件 | 状态 |
|-----|------|------|
| 首页 | HomeScreen | 正常 |
| AI助手 | BusinessAssistantScreen | 正常 |
| 我的 | ProfileScreen | 正常 |

### 5.2 Root Stack 所有页面 (26个)

| Stack Name | 屏幕文件 | 状态 |
|-----------|---------|------|
| MainTabs | HomeScreen/BusinessAssistant/Profile | 正常 |
| Login | auth/LoginScreen | 正常 |
| Settings | SettingsScreen | 正常 |
| Materials | MaterialsScreen | 正常 |
| Messages | MessagesScreen | 正常 |
| Notifications | NotificationsScreen | 正常 |
| Share | ShareScreen | 正常 |
| AIFeature | ai/AIFeatureTemplate (模板) | 正常 |
| AIImage | ai/AIImageScreen | 正常（已实现核心逻辑） |
| AIVideo | ai/AIVideoScreen | 正常 |
| AIEdit | ai/AIEditScreen | 正常（已实现核心逻辑） |
| AIChat | ai/AIChatScreen | 正常 |
| VoiceClone | ai/VoiceCloneScreen | 正常（已实现核心逻辑） |
| AICreateCenter | ai/AICreateCenterScreen | 正常 |
| AICreateDetail | ai/AICreateDetailScreen | 正常 |
| MediaFactory | MediaFactoryScreen | 正常 |
| SupportQR | SupportQRScreen | 正常 |
| BusinessAssistant | ai/BusinessAssistantScreen | 正常 |
| PlanGeneration | ai/PlanGenerationScreen | 正常 |
| PlanView | ai/PlanViewScreen | 正常 |
| BusinessChat | ai/BusinessChatScreen | 正常 |
| Referral | ReferralScreen | 正常 |
| MediaOperation | MediaOperationScreen | 正常 |
| Statistics | StatisticsScreen | 正常 |
| Recruitment | RecruitmentScreen | 正常 |
| Acquisition | AcquisitionScreen | 正常 |
| DigitalHuman | ai/DigitalHumanScreen | 正常 |
| AICopy | ai/AICopyScreen (AIFeatureTemplate包装) | 正常 |

APK 全部 28 个屏幕文件均存在，无占位页面。上一轮修复的 3 个 AI 页面（AIImage、AIEdit、VoiceClone）已实现核心功能逻辑。

### 5.3 Profile 页面菜单

| 菜单项 | 目标 | 状态 |
|--------|------|------|
| 转介绍 | ReferralScreen | 正常 |
| 在线客服 | SupportQRScreen | 正常 |
| 个人资料 | SettingsScreen | 正常 |
| 账号安全 | SettingsScreen | 正常 |
| 服务到期 | SettingsScreen | 正常 |

---

## 六、仅存的"敬请期待"标记（3处，均为产品路线图预留）

| 位置 | 内容 | 性质 |
|------|------|------|
| `customer/ai-factory/page.tsx` L83 | AI短剧 | 产品路线图 - 待开发功能 |
| `customer/ai-factory/page.tsx` L84 | AI漫剧 | 产品路线图 - 待开发功能 |
| `customer/ai-factory/page.tsx` L119 | 非工厂模板类别点击提示 | 用户操作提示 |

**结论：这些不是占位页面bug，而是AI创作工厂页面内的预留功能卡片，属于产品路线图设计。页面本身功能完整。**

---

## 七、统计汇总

| 维度 | 菜单项数 | 有页面 | 缺失 | 占位 | 完整率 |
|------|---------|--------|------|------|--------|
| 公共主站 | 8 | 8 | 0 | 0 | 100% |
| 客户后台 | 11 | 11 | 0 | 0 | 100% |
| 代理商后台 | 6 | 6 | 0 | 0 | 100% |
| 管理员后台 | 10 | 10 | 0 | 0 | 100% |
| APK Tab | 3 | 3 | 0 | 0 | 100% |
| APK Stack | 28 | 28 | 0 | 0 | 100% |
| Profile菜单 | 5 | 5 | 0 | 0 | 100% |
| **合计** | **71** | **71** | **0** | **0** | **100%** |

---

## 八、建议

1. **AI短剧/AI漫剧**：这两个预留功能如需上线，直接在同一 `ai-factory/page.tsx` 中添加对应的处理逻辑即可，UI卡片已就位。
2. **管理员 config 页面**：如确认"功能开关管理"永久下线，可考虑直接删除 `admin/config/page.tsx` 或做 301 重定向。
3. **代理商侧边栏**：如有需要，可考虑将 `agent/recruitment` 添加到侧边栏菜单中，与客户端的"智能招聘"形成对等的管理入口。
