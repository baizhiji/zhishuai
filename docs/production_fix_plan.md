# 智枢AI SaaS系统 生产就绪修复计划

## 当前状态
系统整体就绪度约80%，核心框架已搭建（认证、中间件、大部分API），但存在6个阻断问题、4个质量问题，以及4个架构增强需求。

---

## 第一批：6个阻断问题修复

### 1. 数字人仓库页面 - localStorage → 真实API
- **文件**: `web/app/customer/media/digital-humans/page.tsx`
- **问题**: localStorage存储 + 24个硬编码假数据 + setTimeout模拟克隆
- **后端**: `server/src/routes/digital-human.ts` 已有真实API
- **修复**: 删除所有localStorage逻辑，调用 `/api/digital-human/humans` 等真实API
- **APK**: `apk/src/screens/ai/DigitalHumanScreen.tsx` 同样修复

### 2. 直播间采集页面 - 硬编码mock → 真实API
- **文件**: `web/app/customer/acquisition/live-room/page.tsx`
- **问题**: localStorage + 硬编码评论/商品 + Math.random()统计
- **后端**: `server/src/routes/data-acquisition.ts` 已有API框架
- **修复**: 调用真实采集API，删除所有mock数据

### 3. 高德地图工具 - YOUR_AMAP_KEY + mock降级
- **前端**: `web/app/customer/tools/amap/page.tsx`
- **后端**: `server/src/services/amap.service.ts`
- **修复**: 
  - 前端改用环境变量 `process.env.NEXT_PUBLIC_AMAP_KEY`
  - 后端移除所有MOCK_POI和降级逻辑，无Key时返回错误
  - 创建 `.env.example` 记录需要的Key

### 4. Admin API统计 - mock兜底
- **文件**: `web/app/admin/api-stats/page.tsx`
- **问题**: API请求失败时使用mock数据兜底
- **修复**: 移除mock兜底，API失败时显示错误提示

### 5. 结算API空壳
- **文件**: `server/src/routes/settlement.ts`
- **问题**: 代理商分成记录返回空数组，结算申请未真正处理
- **修复**: 实现真实的结算逻辑（查询分成记录、创建结算申请、更新状态）

### 6. APK版本更新服务 - 完全mock
- **文件**: `apk/src/services/update.service.ts`
- **问题**: checkForUpdate返回固定hasUpdate:false，downloadAndInstall只打开链接
- **修复**: 
  - 调用后端 `/api/app/version/latest` 真实API
  - 后端新增版本管理API
  - 配合expo-updates实现热更新

---

## 第二批：4个质量问题修复

### 7. WEB两套request工具合并
- 搜索并统一为单一request工具
- 确保token刷新逻辑一致

### 8. APK静默吞错
- 搜索所有空catch块，添加用户可见的错误提示

### 9. APK MOCK常量清理
- 删除所有不再使用的MOCK导出

### 10. Prisma migration管理
- 创建正式migration文件

---

## 第三批：架构增强

### 11. 扫码授权登录 - 统一网页方案
**当前状态**: 已有 `browser-auth.service.ts` 使用 Playwright 打开平台登录页、截图二维码
**用户需求**: 所有平台扫码授权通过一种统一方式实现，不限制账号数量

**设计**:
- 后端已实现：Playwright打开平台登录页 → 截图二维码 → 返回给前端 → 轮询检测登录状态
- 前端矩阵管理页面：选平台 → 调用 `/api/oauth/sessions` 获取二维码 → 展示给用户扫码 → 轮询状态
- 支持无限账号：同一平台可添加多个账号，每次创建新session
- 需要确保：前端矩阵管理页面正确调用oauth API

### 12. 全面消除虚拟数据
- 逐页面检查所有mock/hardcode数据
- 替换为真实API调用

### 13. 热更新系统
**当前状态**: APK已安装 `expo-updates@0.27.5`
**需要实现**:
- 后端版本管理API（`/api/app/version/latest`）
- APK端调用真实API检查更新
- expo-updates配置和发布流程

### 14. AI多模型管道增强
**当前状态**: 已有完整的管道架构：
- `ai-model-router.ts`: 模型智能调度（22个模型，关键词匹配+降级）
- `ai-service.ts`: 双通道调用（TokenHub+百炼）
- `pipeline.service.ts`: 多步骤管道（8种业务管道）
- `user-api-key.service.ts`: 用户API Key管理

**需要增强**:
- 多模型协作管道（并行调用多模型+汇总最优结果）
- 招聘功能：AI自动搜索+主动沟通+面试邀请
- 更精确的任务-模型匹配
