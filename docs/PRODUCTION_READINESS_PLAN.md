# 智枢AI SaaS系统 — 生产就绪全面评估与改进方案

> 评估日期：2026-06-17  
> 评估范围：Web端、APK端、Server端、数据统一性、稳定性

---

## 一、当前项目现状总览

| 维度 | Web端 | APK端 | Server端 |
|------|-------|-------|----------|
| 技术栈 | Next.js 14 + Ant Design + Tailwind | React Native + Expo + React Navigation | Express + Prisma + MySQL(TDSQL-C) |
| 页面/屏幕数 | ~75个页面(3角色) | ~30个屏幕 | ~55个路由文件 |
| 认证方式 | JWT + localStorage | JWT + AsyncStorage | JWT(7天过期) |
| API基础地址 | `https://api.baizhiji.net/api` | `https://api.baizhiji.net/api` | 端口3001 |
| 数据库模型 | — | — | 40+ Prisma模型 |

---

## 二、关键问题清单（按优先级排列）

### P0 — 阻塞性问题（必须修复才能上线）

#### 1. eas.json 合并冲突未解决
`apk/eas.json` 存在 Git 合并冲突标记（`<<<<<<< HEAD` / `=======` / `>>>>>>> 962968886`），会导致 EAS Build 完全无法工作，APK无法构建。

**修复方案**：清理冲突标记，合并双方配置：
```json
{
  "cli": {
    "version": ">= 13.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "distribution": "store", "android": { "buildType": "apk" } }
  }
}
```

#### 2. APK端大量页面使用硬编码Mock数据
以下APK屏幕使用**完全硬编码的假数据**，无法在真实环境中使用：

| 屏幕 | 严重程度 | 说明 |
|------|---------|------|
| `DashboardScreen` | **致命** | 所有统计数据（用户数/活跃/发布量/趋势图）全部本地常量 |
| `CRMScreen` | **致命** | 客户列表、商机、跟进记录全部 `mockCustomers` 硬编码 |
| `MarketingScreen` | **致命** | 活动/优惠券/分析全部Mock |
| `MediaFactoryScreen` | **致命** | 内容工厂全部 `useState` 初始化假数据 |
| `AIScreen`（简化版） | **致命** | 用 `setTimeout` 随机选择预设回复 |
| `StatisticsScreen` | **致命** | 所有数据统计为本地常量 |
| `MessagesScreen` | **严重** | `MOCK_MESSAGES` 硬编码消息列表 |
| `MaterialsScreen` | **严重** | `mockMaterials` 硬编码8条素材，不调API |

**修复方案**：每个屏幕需要：
- 删除所有 Mock 数据
- 对接真实 API（Server端大部分路由已实现）
- 添加 loading/error 状态处理

#### 3. APK端"演示模式"回退逻辑
`LoginScreen` 在验证码发送失败时会回退到"演示模式"，这意味着：
- 短信服务异常时，用户可以绕过认证登录
- 生产环境绝对不能容忍此行为

**修复方案**：删除演示模式回退逻辑，验证码失败直接报错。

#### 4. APK端 VoiceCloneScreen 纯模拟
声音克隆功能使用 `handleMockClone` 模拟延迟后返回假结果，无法实际克隆声音。

**修复方案**：对接真实语音克隆API（如腾讯云语音克隆、阿里云CosyVoice），或暂时标记为"即将上线"。

#### 5. Server端多个路由文件被禁用
以下路由文件被 `.disabled` 后缀禁用，意味着对应功能完全不可用：

| 禁用文件 | 影响功能 |
|---------|---------|
| `report.ts.disabled` | 数据报表API |
| `settlement.ts.disabled` | 代理商结算API |
| `sms.ts.disabled` | 短信服务备用路由 |
| `social-account.ts.disabled` | 社交账号备用路由 |
| `statistics.ts.disabled` | 数据统计API |
| `version.ts.disabled` | 版本管理API |

**修复方案**：逐一检查禁用原因，修复代码问题后恢复启用。报表和统计是核心功能，必须优先恢复。

---

### P1 — 严重问题（功能可用但不稳定/不完整）

#### 6. APK端 vs Web端 功能对齐严重不足

Web端有 **45个客户页面**，APK端仅约 **30个屏幕**，且很多只是导航壳。功能对比如下：

| 功能模块 | Web端页面 | APK端屏幕 | 差距 |
|---------|----------|----------|------|
| 工作台/仪表盘 | Dashboard(功能丰富) | DashboardScreen(全假数据) | 数据全部假的 |
| AI对话 | ai-chat(完整) | AIChatScreen(完整) | 基本对齐 |
| 编程助手 | code-assistant(完整) | CodeAssistantScreen(有后备) | 基本对齐 |
| 数字人 | digital-human + media/digital-humans | DigitalHumanScreen(占位) | APK缺失管理功能 |
| 声音克隆 | — | VoiceCloneScreen(纯模拟) | 无真实功能 |
| CRM | crm + crm/automation + crm/public-pool + crm/reminders + crm/tags | CRMScreen(全Mock) | APK严重缺失 |
| 素材库 | materials | MaterialsScreen(Mock数据) | APK严重缺失 |
| 转介绍 | referral | ReferralScreen(有API) | 基本对齐 |
| 工单 | tickets | 缺失 | APK完全缺失 |
| 社交账号 | social-accounts | 缺失 | APK完全缺失 |
| 员工管理 | employees | StaffManagementScreen(有API) | 基本对齐 |
| 设置中心 | settings(4个子页) | 缺失 | APK完全缺失 |
| 获客 | acquisition(4个子页) | AcquisitionScreen | 部分对齐 |
| 招聘 | recruitment(4个子页) | RecruitmentScreen | 部分对齐 |
| 数据报表 | report | 缺失 | APK完全缺失 |
| API密钥 | api-keys | 缺失 | APK完全缺失 |
| 自动回复 | auto-reply | 缺失 | APK完全缺失 |
| 登录日志 | login-logs | 缺失 | APK完全缺失 |
| 分享 | share(3个子页) | ShareScreen | 部分对齐 |
| 媒体运营 | media(6个子页) | MediaOperationScreen(纯导航) | APK严重缺失 |
| 工具 | tools/tianyancha + tools/amap | 缺失 | APK完全缺失 |
| 管理员端 | admin(17个页面) | 缺失 | APK完全缺失 |
| 代理商端 | agent(13个页面) | 缺失 | APK完全缺失 |

**缺失功能统计**：APK端缺失约 **20+ 个核心功能模块**。

#### 7. 两端数据不统一

| 问题 | 说明 |
|------|------|
| 仪表盘数据 | Web端调 `dashboard-stats` 路由获取真实数据，APK端硬编码假数据 |
| CRM数据 | Web端调 `crm` 路由，APK端用 `mockCustomers` |
| 素材库 | Web端调 `materials` 路由，APK端用 `mockMaterials` |
| 通知系统 | Web端调 `notifications` 路由，APK端仅使用本地存储通知 |
| 统计报表 | Web端有 `report` 路由(被禁用)，APK端全部硬编码 |

**核心原因**：APK端很多屏幕在开发时先写了 UI 壳和 Mock 数据，但没有完成 API 对接。

#### 8. 两套独立的HTTP客户端
Web端存在两套请求库：
- `lib/api.ts` — 基础版
- `lib/request.ts` — 增强版(带刷新Token逻辑)

不同页面使用不同的请求库，行为不一致。

**修复方案**：统一为 `lib/request.ts`，删除 `lib/api.ts` 或将其改为 `request.ts` 的别名。

#### 9. JWT认证的安全隐患
| 问题 | 说明 |
|------|------|
| Token存储 | Web端存在 `localStorage`，APK端存在 `AsyncStorage`，均为明文存储 |
| 刷新机制 | Web端401时尝试刷新，APK端401时直接跳登录页（丢失用户操作上下文） |
| 多设备登录 | 无多设备登录管理，同一账号可无限设备同时在线 |
| 员工登录 | 员工有独立的 `EmployeeLoginLog` 模型但登录流程可能未完全对接 |

#### 10. 多租户隔离不完整
Prisma Schema 中数据隔离主要依赖 `userId` 字段过滤，但：
- 部分路由可能缺少 `userId` 过滤条件
- 员工( Employee ) 访问权限未清晰定义（员工能看什么数据？）
- 代理商( Agent ) 管理的客户数据边界未明确
- 缺少行级安全策略（Row Level Security）

---

### P2 — 重要问题（影响体验和运维）

#### 11. 推送通知不完整
- APK端 `NotificationsScreen` 仅使用本地通知存储
- 没有 FCM/APNs 集成，无法实现远程推送
- `expo-notifications` 已配置但未对接后端推送

#### 12. 社交账号授权(OAuth)流程未闭环
- Server端有 `OAuthSession` 模型和 `oauth.ts` 路由
- Web端有 `social-accounts` 页面
- APK端完全缺失社交账号绑定功能
- 扫码授权的完整流程需要验证

#### 13. 定时发布系统未实现
- 数据库有 `ScheduledTask` 模型
- Server端有定时任务的数据结构
- 但缺少实际的定时执行引擎（如 node-cron / bull queue）

#### 14. 内容发布到社交平台未闭环
- Server端有 `AutomationTask` / `TaskExecution` 模型
- 但实际发布到抖音/小红书/视频号等平台的 API 对接需要验证
- 发布后的数据回采（播放量/点赞/评论）自动化程度未知

#### 15. 错误监控和日志系统
- 无 Sentry / 自建错误监控
- 无结构化日志（ELK / Loki）
- AdminLog 仅记录管理员操作，不记录系统错误
- API调用无全链路追踪

#### 16. 性能优化
- Web端 Dashboard 页面 22.8KB，可能加载缓慢
- 无 CDN 配置确认
- 无 API 响应缓存策略
- 数据库查询无慢查询监控

#### 17. 文件上传与存储
- `.env` 中配置了 `UPLOAD_DIR="./uploads"` 为本地存储
- 生产环境应使用对象存储（COS / OSS）
- APK端下载链接 `/app/zhishuai.apk` 需确认文件实际存在

---

## 三、改进方案（分阶段执行）

### 第一阶段：阻塞修复（1-2天）

| 序号 | 任务 | 预估工时 |
|------|------|---------|
| 1.1 | 解决 `eas.json` 合并冲突 | 0.5h |
| 1.2 | 删除 APK 端所有硬编码 Mock 数据，改为真实 API 调用 | 4h |
| 1.3 | 删除 LoginScreen 的"演示模式"回退 | 0.5h |
| 1.4 | VoiceCloneScreen 标记为"即将上线"或对接真实API | 2h |
| 1.5 | 启用 `report.ts.disabled`、`statistics.ts.disabled`，修复代码错误 | 3h |

### 第二阶段：数据统一与功能对齐（3-5天）

| 序号 | 任务 | 预估工时 |
|------|------|---------|
| 2.1 | APK DashboardScreen 对接 `dashboard-stats` API | 2h |
| 2.2 | APK CRMScreen 对接 `crm` API（客户/商机/跟进） | 4h |
| 2.3 | APK MaterialsScreen 对接 `materials` API | 2h |
| 2.4 | APK MessagesScreen 对接 `notifications` API | 2h |
| 2.5 | APK StatisticsScreen 对接 `statistics` API | 2h |
| 2.6 | APK MediaFactoryScreen 对接 `media`/`content-publish` API | 4h |
| 2.7 | APK MarketingScreen 对接相关 API | 3h |
| 2.8 | APK AIScreen 移除，统一使用 AIChatScreen | 1h |
| 2.9 | Web端统一 HTTP 客户端为 `lib/request.ts` | 2h |

### 第三阶段：APK缺失功能补齐（5-8天）

**优先级从高到低排列**：

| 序号 | 新增APK功能 | 对应Web功能 | 预估工时 |
|------|-----------|------------|---------|
| 3.1 | 工单系统 | tickets | 4h |
| 3.2 | 设置中心(企业信息/安全/主题) | settings | 4h |
| 3.3 | 数据报表 | report | 3h |
| 3.4 | 自动回复 | auto-reply | 3h |
| 3.5 | 社交账号绑定 | social-accounts | 4h |
| 3.6 | API密钥管理 | api-keys | 2h |
| 3.7 | 登录日志 | login-logs | 1h |
| 3.8 | 媒体运营完整功能 | media(6子页) | 8h |
| 3.9 | 数字人管理 | media/digital-humans | 4h |
| 3.10 | 工具集成(天眼查/地图) | tools | 3h |
| 3.11 | 获客完整功能 | acquisition(4子页) | 4h |
| 3.12 | 招聘完整功能 | recruitment(4子页) | 4h |
| 3.13 | 分享完整功能 | share(3子页) | 3h |

> 注：管理员端和代理商端在APK上暂不实现（管理操作通常在PC端完成），后续根据需求决定。

### 第四阶段：安全与稳定性（3-5天）

| 序号 | 任务 | 预估工时 |
|------|------|---------|
| 4.1 | JWT Token 加密存储（Web端 HttpOnly Cookie / APK端 SecureStore） | 3h |
| 4.2 | APK端 Token 刷新机制（401时自动刷新而非跳登录） | 2h |
| 4.3 | 多设备登录管理（记录设备信息，可远程踢出） | 4h |
| 4.4 | 员工权限体系完善（RBAC，定义每个角色能访问的功能） | 6h |
| 4.5 | 多租户行级安全审计（逐一检查路由的 userId 过滤） | 4h |
| 4.6 | API 限流（Rate Limiting，防暴力破解） | 2h |
| 4.7 | HTTPS 全站强制 + 安全头（CSP/HSTS/X-Frame-Options） | 2h |
| 4.8 | 敏感数据脱敏（手机号/身份证/密码显示处理） | 2h |

### 第五阶段：运维与体验优化（3-5天）

| 序号 | 任务 | 预估工时 |
|------|------|---------|
| 5.1 | 接入 Sentry 错误监控（Web+APK+Server三端） | 3h |
| 5.2 | 结构化日志（Winston + Loki 或 ELK） | 4h |
| 5.3 | 文件存储迁移到腾讯云COS | 3h |
| 5.4 | CDN配置（静态资源加速） | 2h |
| 5.5 | 数据库慢查询监控 + 索引优化 | 3h |
| 5.6 | API 响应缓存（Redis） | 4h |
| 5.7 | 定时任务引擎（Bull Queue + Redis） | 4h |
| 5.8 | FCM/APNs 远程推送集成 | 4h |
| 5.9 | APP版本更新检查与热更新（Expo Updates） | 2h |
| 5.10 | 自动化部署流水线（CI/CD）完善 | 3h |

---

## 四、数据统一架构设计

### 当前问题
```
Web端 ──→ Server API ──→ MySQL
APK端 ──→ Server API ──→ MySQL  （但很多页面直接用Mock，没走API）
```

### 目标架构
```
Web端 ──→ Server API ──→ MySQL
APK端 ──→ Server API ──→ MySQL
                    ↘→ Redis（缓存层）
                    ↘→ COS（文件存储）
```

### 数据一致性保障措施

1. **单一数据源原则**：所有数据操作必须通过 Server API，两端不缓存业务数据到本地（Token除外）
2. **乐观锁**：对 CRM 客户、素材等可能被多端同时编辑的数据，增加版本号字段
3. **WebSocket 实时同步**：当一端修改数据时，另一端通过 WebSocket 收到变更通知并自动刷新
4. **离线支持**：APK端对于已查看的数据做本地缓存，网络恢复后自动同步（需标记离线修改）

---

## 五、推荐执行顺序

```
第一阶段（阻塞修复）
    ↓ 必须完成后才能进入测试
第二阶段（数据统一）
    ↓ 核心功能数据真实化
第三阶段（APK功能补齐）
    ↓ 功能对齐
第四阶段（安全加固）
    ↓ 可与第三阶段并行
第五阶段（运维优化）
    ↓ 上线后持续优化
```

**最小可用产品（MVP）标准**：完成第一、二阶段后即可内测；完成一、二、四阶段后可正式上线。

---

## 六、风险提示

1. **社交平台API对接风险**：抖音/小红书等平台的开放API可能有额度限制和审核要求，需要提前申请
2. **语音克隆合规风险**：声音克隆涉及生物特征数据，需确认合规性（如《个人信息保护法》）
3. **短信服务成本**：验证码短信需配置真实短信通道（阿里云/腾讯云短信），有单条成本
4. **AI API成本**：对话/生成类功能依赖外部AI API，需做好成本控制和用量监控
5. **APK审核**：如果上架应用商店，需注意应用商店审核要求（隐私政策、权限声明等）

---

## 七、快速验收清单

上线前逐项确认：

- [ ] eas.json 合并冲突已解决
- [ ] APK 可正常构建（`eas build --platform android`）
- [ ] 所有 APK 页面无硬编码 Mock 数据
- [ ] 登录流程无"演示模式"回退
- [ ] Web端和APK端登录同一账号，看到的数据一致
- [ ] CRM客户数据在两端增删改查同步
- [ ] 素材库数据在两端同步
- [ ] AI对话历史在两端同步
- [ ] 仪表盘数据为真实数据
- [ ] 禁用的路由文件已恢复或确认不需要
- [ ] JWT Token 安全存储
- [ ] API限流已配置
- [ ] HTTPS 全站启用
- [ ] 错误监控已接入
- [ ] 文件上传使用对象存储
- [ ] APP更新检查功能可用
