# 智枢AI 系统故障修复报告

**日期**: 2026-08-01
**系统**: https://baizhiji.net (150.109.60.130)

---

## 问题概述

用户报告管理员数据大盘、代理商门户、分析页、功能开关页等多个页面出现错误（白屏、404、`eA.some is not a function` 崩溃等）。

## 根因分析

经过系统性排查，共发现 4 个独立的 bug：

1. **CORS 拦截** — `server/src/index.ts` 的 `allowedOrigins` 只包含 localhost，生产域名 `baizhiji.net` 被 CORS 策略拦截，所有前端 API 请求返回 CORS 错误。

2. **响应格式破坏** — `web/utils/request.ts` 的 `handleResponse` 函数将所有 API 响应展开：`{ ...data, ...rest, pagination }`。当 API 返回纯数组 `{ data: [...] }` 时，展开操作将数组转换为对象 `{ 0: item1, 1: item2 }`，丢失了数组方法（如 `.some()`），导致 antd Table/Select 等组件崩溃。

3. **API 路径不匹配（2处）** — 前端调用的 API 路径与后端实际路由不一致：
   - 分析页调用 `/api/admin/statistics/overview`，实际路径 `/api/statistics/admin/overview`
   - 功能开关页调用 `/api/admin/features`，实际路径 `/api/admin/admin`

4. **contentCategoryConfig 空引用** — 客户素材库页面上，当素材分类不在配置表中时，`contentCategoryConfig[record.category]` 返回 `undefined`，后续访问 `.type` 抛出 `Cannot read properties of undefined (reading 'type')`。

## 修复清单

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 1 | `server/src/index.ts` | CORS 拦截 | allowedOrigins 新增 `https://baizhiji.net` 和 `https://www.baizhiji.net` |
| 2 | `web/utils/request.ts` | 数组转对象 | 响应体仅含 `data` 单键时直接返回数组，不做展开 |
| 3 | `server/src/routes/admin-features.ts` | 路由路径错误 | `GET/PUT /admin` → `GET/PUT /features` |
| 4 | `web/services/api.ts` | initFeatures 路径 | `/admin/features/admin/init` → `/admin/features/init` |
| 5 | `web/app/admin/analytics/page.tsx` | API 路径错误 | `/api/admin/statistics/overview` → `/api/statistics/admin/overview` |
| 6 | `web/app/customer/materials/page.tsx` | undefined.type 崩溃 | `categoryConfig.type` → `categoryConfig?.type` |

## 验证结果

### 管理员门户（6 页全部通过）
- /admin/dashboard ✅ 数据大盘正常渲染，显示总用户数3、代理商数1等
- /admin/tenants ✅ 
- /admin/agents ✅
- /admin/api-providers ✅
- /admin/analytics ✅ 修复后不再 404，正常显示
- /admin/features ✅ 修复后功能开关列表正常加载

### 代理商门户（5 页全部通过）
- /agent/dashboard ✅
- /agent/customers ✅
- /agent/acquisition ✅
- /agent/analytics ✅
- /agent/features ✅

### 客户门户（5 页测试通过）
- /customer/dashboard ✅
- /customer/ai-chat ✅
- /customer/materials ✅ 修复后不再崩溃，素材列表正常
- /customer/social-accounts ✅
- /customer/ai-factory ✅

### 登录交叉验证
- 管理员 18601655222 → HTTP 200 ✅
- 代理商 13900000099 → HTTP 200 ✅
- 客户 18100090667 → HTTP 200 ✅

## 遗留问题（非本次回归，预存）

1. `/api/version/announcements/latest` — 接口未实现，返回 404，导致 Navbar 公告加载提示
2. 登录页面在特定条件下出现 alert 弹窗，可能阻塞 React 渲染（需要进一步排查来源）
3. 部分 API 端点未实现（如 `/api/acquisition/dashboard`）

## 部署状态

所有修复已通过 SCP 上传至 150.109.60.130，server 和 web 均已重新构建并 pm2 重启。
