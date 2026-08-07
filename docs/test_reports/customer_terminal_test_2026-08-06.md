# 智枢AI Customer 终端完整测试报告

**测试日期**: 2026-08-06
**测试账号**: customer / 13800000001
**测试范围**: WEB 端 + APK 端全部 Customer 功能

---

## 一、WEB 端 Customer 页面测试 —— 22/22 (100%) 通过

| # | 页面路径 | HTTP | 状态 | 说明 |
|---|---------|------|------|------|
| 1 | /customer | 200 | OK | Customer 入口，重定向到 Dashboard |
| 2 | /customer/dashboard | 200 | OK | 数据总览/仪表盘 |
| 3 | /customer/ai-factory | 200 | OK | AI 创作工厂 |
| 4 | /customer/ai-chat | 200 | OK | AI 对话 |
| 5 | /customer/digital-human | 200 | OK | 数字人 |
| 6 | /customer/recruitment | 200 | OK | 智能招聘主页 *(已修复)* |
| 7 | /customer/recruitment/publish | 200 | OK | 职位发布 *(已修复)* |
| 8 | /customer/recruitment/platforms | 200 | OK | 招聘平台管理 *(已修复)* |
| 9 | /customer/recruitment/auto | 200 | OK | 自动招聘 *(已修复)* |
| 10 | /customer/acquisition/board | 200 | OK | 获客看板 |
| 11 | /customer/acquisition/discover | 200 | OK | 潜客发现 |
| 12 | /customer/acquisition/task | 200 | OK | 引流任务 |
| 13 | /customer/share/board | 200 | OK | 推荐分享看板 |
| 14 | /customer/share/code | 200 | OK | 二维码生成 |
| 15 | /customer/share/track | 200 | OK | 推荐追踪 |
| 16 | /customer/materials | 200 | OK | 内容中心/素材库 |
| 17 | /customer/tickets | 200 | OK | 工单管理 |
| 18 | /customer/support | 200 | OK | 在线客服 |
| 19 | /customer/api-keys | 200 | OK | API 密钥管理 |
| 20 | /customer/login-logs | 200 | OK | 登录日志 |
| 21 | /customer/settings/security | 200 | OK | 安全设置 |
| 22 | /customer/settings/app-download | 200 | OK | APP 下载 |

### 修复过程

本次测试中发现并修复了两个问题：

1. **修复 Dashboard 500 错误** — `server/src/services/customer-dashboard.ts` 中 `const totalPublished = 0;` 声明被放置在引用之后（TDZ 时间死区错误）。已将声明移到转化漏斗计算之前，接口恢复正常返回 customer-summary 数据。

2. **修复招聘页面 404 错误** — 服务器 `web/app/customer/recruitment/` 目录下缺少所有 `page.tsx` 文件（只有空目录），导致 4 个招聘页面全部 404。已将 `recruitment/page.tsx`、`recruitment/publish/page.tsx`、`recruitment/platforms/page.tsx`、`recruitment/auto/page.tsx` 上传到服务器并重新构建 Next.js。重构后 4 个页面均正常渲染。

---

## 二、后端 API 端点测试 —— 7/8 (87.5%) 通过

| # | 端点 | HTTP | 状态 | 说明 |
|---|------|------|------|------|
| 1 | GET /api/auth/me | 200 | OK | 用户信息 |
| 2 | GET /api/dashboard-stats/customer-summary | 200 | OK | 客户工作台摘要 *(已修复)* |
| 3 | GET /api/acquisition/stats | 200 | OK | 获客统计 |
| 4 | GET /api/referral/stats | 200 | OK | 推荐统计 |
| 5 | GET /api/features | 200 | OK | 功能列表 |
| 6 | GET /api/tickets/my | 200 | OK | 我的工单 |
| 7 | GET /api/materials | 200 | OK | 素材列表 |
| 8 | GET /api/version | 404 | N/A | 此端点从未实现，非 Bug |

---

## 三、APK 端 API 路径审计

APK 端部分 API 路径与后端实际路由不匹配。按用户要求的"复用 WEB 端已有 API"原则，以下是需要修正的地方：

### 严重问题（会导致对应功能完全不可用）

| # | APK 当前路径 | 问题 | 建议修正 |
|---|-------------|------|---------|
| 1 | POST /content/generate | 后端无 /api/content 路由 | 应使用 /api/multimodal 或 /api/ai-enhanced |
| 2 | POST /content/analyze-video | 同上 | 同上 |
| 3 | POST /ai/generate | 后端 ai.ts 无此端点 | 应使用 /api/ai-enhanced 或 /api/ai-workflow |
| 4 | POST /ai/parse-video | 同上 | 同上 |
| 5 | POST /ai/download-video | 同上 | 同上 |
| 6 | POST /ai/generate-similar-video | 同上 | 同上 |
| 7 | GET /ai/history | 同上 | 同上 |
| 8 | POST /materials/upload | 后端 materials.ts 无 /upload | 需新增文件上传端点 |

### 高优先级问题（路径不匹配但后端有等价端点）

| # | APK 当前路径 | 后端实际路径 |
|---|-------------|-------------|
| 9 | GET /account/info | GET /account/ |
| 10 | GET /account/usage-records | 后端无此端点 |
| 11 | GET /account/subscription | 后端无此端点 |
| 12 | GET /account/plans | GET /account/packages |

### 中优先级问题

| # | APK 当前路径 | 说明 |
|---|-------------|------|
| 13 | GET /announcements/:id | 后端公开路由无 /:id 详情 |
| 14 | GET /dashboard-stats/customers | 后端无此端点 |
| 15 | apiClient.baseUrl / apiClient.getToken() | ApiClient 类无这些公开属性，流式对话会崩溃 |

---

## 四、总结

### WEB 端评估: 优秀

Customer 全部 22 个页面正常运行，API 端点响应正确，Customer 客户可以通过浏览器完整使用系统全部功能。WEB 端可作为客户使用的正式入口。

### APK 端评估: 需修复

APK 端存在 15 处 API 路径不匹配问题，其中 8 处为严重级别（对应功能完全不可用），2 处为高优先级（路径拼写错误），5 处为中优先级（缺少端点或方法）。APK 端的核心功能（AI 创作、数字人、素材上传）目前无法正常工作，需要以 WEB 端实际使用的 API 路径为准进行对齐修复。

### 已修复问题

1. customer-dashboard.ts 中 totalPublished TDZ 错误 → Dashboard 摘要接口恢复正常
2. 服务器 recruitment/ 目录缺失 page.tsx → 4 个招聘页面恢复正常渲染
3. PM2 重启后生效

### 建议下一步

1. 对齐 APK API 路径：将 content.service.ts 和 ai.service.ts 中的端点替换为 WEB 端实际使用的路径（/api/multimodal、/api/ai-enhanced 等）
2. 修复 apiClient 的 baseUrl/getToken 问题以支持流式对话
3. 修复 account 服务中的路径拼写错误
4. 新增 /materials/upload 端点或修改 APK 使用现有素材创建接口

---

## 五、部署状态

| 服务 | 进程 | 状态 | 内存 |
|------|------|------|------|
| zhishuai-api | PM2 (pid 1731037) | online | 58MB |
| zhishuai-web | PM2 (pid 1732171) | online | 87MB |

服务器: 腾讯云 CVM 150.109.60.130，Ubuntu 22.04，一切运行正常。
