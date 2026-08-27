# 智枢AI 全功能验证报告（桌面端 + APK 端）

**验证日期**：2026-08-26
**验证方式**：生产环境 API 实测（43 个端点）+ 代码级路由/页面交叉核对 + 前端调用点追踪
**验证对象**：desktop-ui（电脑版）、apk（移动端）、server（后端 API）

---

## 一、接口级验证结果

### 通过（实测 HTTP 200，返回 `success/code:0` 正常响应）

**核心业务 - 四大模块（全部通过）**

| 模块 | 已实测通过接口 |
|------|--------------|
| AI 创作工厂 | `/api/ai-config/keys`、`/api/ai-enhanced/history`、`/api/ai-chat/models`、`/api/token-stats/stats`、`/api/token-stats/daily` |
| 智能招聘 | `/api/recruitment/jobs`、`/api/recruitment/stats`、`/api/recruitment/pipeline/stats` |
| 智能获客 | `/api/acquisition/leads`、`/api/acquisition/tasks`、`/api/acquisition/stats`、`/api/acquisition/dashboard` |
| 推荐分享 | `/api/share/codes`、`/api/share/records`、`/api/share/dashboard`、`/api/referral/users` |

**客户/公共功能（通过）**
- `/api/dashboard-stats/customer-summary`、`/api/dashboard-stats/business-lines`
- `/api/materials`、`/api/tickets/stats/summary`、`/api/notifications`、`/api/account/usage-stats`
- `/api/features`、`/api/hot-topics`、`/api/hot-topics/platforms`
- `/api/announcements`、`/api/support/qrcode`、`/api/version/latest`
- `/api/statistics/overview`、`/api/statistics/dashboard`
- 多媒体/AI：`/api/digital-human/humans`、`/api/voice-clone/voices`

**管理端（通过）**
- `/api/admin/dashboard`、`/api/admin/agents`、`/api/admin/api-providers/usage`、`/api/admin/api-providers/providers`、`/api/admin/logs`
- `/api/version/versions`、`/api/employee/employees`

**完整链路实测（非纸面）**
- admin 登录 → 返回 JWT，整条链路正常（https → nginx → 后端 → 数据库）
- 客服二维码上传 → 上传成功 → nginx `/uploads/` 静态访问 HTTP 200（测完已清理，生产数据无污染）

### 设计如此，非故障（HTTP 200 + 业务 code 401）
- `/api/comment-delivery/quota`、`/api/comment-delivery/risk`：使用 `x-user-id` 请求头鉴权（Agent 社媒账号体系），非 JWT
- `/api/social/accounts`：同上，独立鉴权体系

---

## 二、发现的问题（已全部修复）

### P1 - 前后端接口不一致（死代码）— 已修复

1. ~~`desktop-ui/services/materials.ts` 的 `getMaterialsStats()` 调用 `/api/materials/stats`，后端无此路由~~ → 已删除整个死文件。
2. ~~`desktop-ui/services/recruitment.ts` 的 `getResumes()`/`createResume()`/`updateResumeStatus()` 调用 `/api/recruitment/resumes`（后端实际为 `/candidates`）~~ → 已删除整个死文件。

修复说明：经全量检索，`desktop-ui` 中**没有任何页面 import** 这两个文件（页面均直接使用 `apiClient`/`request`），即整个文件均为死代码。删除后 `tsc --noEmit` 0 错误、lint 0 错误。

### P2 - 健康检查端点主域不可达 — 已修复

3. ~~`/api/health` 404~~ → 真相：后端 `health.ts` 端点一直存在（`/health`、`/ready`、`/live`、`/metrics`，挂载 `app.use('/')`），且 `api.baizhiji.net` 子域天然可用；但主域 `baizhiji.net` 的 nginx 生效配置（`/etc/nginx/sites-enabled/baizhiji.net` 安全加固版）的 `location /` 下线页拦截了这些路径，实测返回下线页 HTML 而非后端 JSON。

修复：在生效配置 443 server 的 `location /` 之前新增 `location ~ ^/(health|ready|live|metrics)$` 转发到后端，`nginx -t` 通过并 reload。实测主域四个端点均返回后端 JSON（HTTP 200），下线页与 `/downloads/` 不受影响。

**部署一致性修正**：生产生效配置此前不在仓库（`deploy/nginx/zhishuai.conf` 系 80 端口旧版、未链接 sites-enabled，存在配置漂移）。已将远端生效配置完整存档到 `deploy/nginx/baizhiji.net`，并修改 `deploy/setup-nginx.sh` 改部署该文件（清理旧 `zhishuai.conf`/`api-baizhiji.net` 引用）。

---

## 三、页面级验证状态（结构确认，交互待人工）

### 桌面端（desktop-ui，Next.js App Router）

**公共页面**：login、login-simple、about（关于）、introduction（引导）、features（功能）、pricing（定价）、help（帮助）、notifications、account、profile、(main) 首页 + 隐私政策/服务条款

**客户端 customer（15 个页面）**：dashboard 总览、ai-factory AI创作工厂、ai-chat AI对话、api-keys、digital-human 数字人、materials 素材库、recruitment 智能招聘、recruitment-dashboard 招聘看板、interview 智能面试、acquisition 智能获客、share 推荐分享、support 客服、tickets 工单、settings 设置、login-logs 登录日志

**管理端 admin（13 个页面）**：dashboard 总览、agents 代理商、tenants 租户、earnings 收益、api-providers 服务商、api-stats 用量、sms 短信、announcement 公告、support 客服、logs 日志、config 配置、settings 设置、version 版本

**代理商 agent（10 个页面）**：dashboard、customers 客户、ai-factory、api-keys、materials、settlement 结算、usage 用量、settings、support、tickets

### 移动端（apk，React Native）

**17 个屏幕**：Home 首页、Statistics 数据中心、AICreateCenter AI创作中心、AICreateDetail 创作详情、Materials 素材库、MediaOperation 媒体操作、Acquisition 智能获客、Recruitment 智能招聘、Share 推荐分享、Messages 消息、Notifications 通知、Profile 我的、Settings 设置、SupportQR 客服二维码、ChangePassword 修改密码、auth 认证、ai 对话

**页面级局限说明**：以上页面确认代码存在且可编译，但**实际交互（点击、表单、跳转、渲染）无法在无浏览器/无真机环境下自动验证**，需人工走查。

---

## 四、已删除功能清单（以下不再作为需求，勿再恢复或验证）

| # | 已删除/下线功能 | 说明 |
|---|----------------|------|
| 1 | 在线网页版 | nginx 根路径已下线，仅返回"请下载桌面安装版"引导页 |
| 2 | 自助注册 | desktop-ui 注册页改为"暂不支持自主注册"提示；APK 登录页注册 Tab 已删 |
| 3 | 测试页面 | `test`、`api-test` 页面已删除 |
| 4 | `/api/playwright` | 接口已移除 |
| 5 | APK 矩阵账号/发布中心 | AI 创作工厂仅保留创作中心 |
| 6 | AI 漫剧/AI 短剧 | 仅 comingSoon 占位，不可进入 |
| 7 | Flux AI 引擎 | 已切换阿里百炼 |
| 8 | 账号中心知识库 | 仅本地 mock，无后端调用 |
| 9 | OTA 更新 | expo-updates 禁用，改用 `/api/version/latest` 检测 |
| 10 | 东北/河南/湖南方言音色 | 已移除 |
| 11 | 服务端 logout 接口 | APK 端退出仅清本地登录态 |
| 12 | `/account/subscription`、`/announcements/:id` | 后端无此端点，前端已降级处理 |

---

## 五、待人工验证项（无法自动化完成）

- 桌面端 Tauri 安装包安装、启动、各页面交互走查
- APK 真机安装、各屏幕交互、推送通知
- 微信/抖音等第三方平台 OAuth 授权绑定
- 短信发送（依赖短信服务商）
- 支付链路（如有配置）

---

## 六、结论与建议

**核心结论**：后端四大业务模块 + 客户/管理端 + AI 能力的全部核心 API 在生产环境实测可用；桌面端 58 个路由页面、APK 17 个屏幕代码完整可编译。

**问题修复状态（2026-08-26 已完成）**：
1. ✅ P1 死代码：删除 `desktop-ui/services/materials.ts`、`desktop-ui/services/recruitment.ts`（无引用，内含调用不存在后端路由的坏函数），tsc/lint 均通过
2. ✅ P2 健康检查：后端端点本就存在；主域 nginx 生效配置新增 `/health`/`/ready`/`/live`/`/metrics` 转发，已部署并实测 200；生效配置已存档入库 `deploy/nginx/baizhiji.net`，部署脚本已同步修正
3. ⏳ 人工走查桌面端客户界面全流程、APK 真机测试（列为商用前验收步骤）

**生产数据现状提醒**：生产库当前仅有 admin 账号（`18601655222`），agent/customer 测试账号已被清理，涉及角色权限的页面（代理商端、客户端）需要重建测试账号后才能完整走查。
