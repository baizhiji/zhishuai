# 5个问题修复总结

## 修复时间：2026-06-23

## 问题 0：API Key 权限控制（新增）
**需求**：阿里云百炼和腾讯云 TokenHub 的 API Key 仅用于管理员 18601655222 登录测试，不给普通客户使用。

**修改文件**：
1. `server/src/routes/ai-chat.ts` — `getUserApiKey` 增加 `userRole` 参数，非 admin 不 fallback 到环境变量
2. `server/src/routes/code-assistant.ts` — 同上
3. `server/src/services/pipeline.service.ts` — `callProvider` 增加 `userId` 参数，优先使用用户自己的 Key

**效果**：
- 管理员登录 → 可使用平台环境变量中的 API Key
- 普通用户登录 → 必须自己在「个人设置」中绑定 API Key，否则 AI 功能不可用
- 提示信息引导用户到「个人设置」页面配置 Key

## 问题 1：SSL 证书域名不匹配
**修复**：创建了 `scripts/fix_ssl_cert.sh` 脚本，需要在服务器上执行修复

## 问题 2：Content Factory 视频生成使用 placeholder
**修改文件**：`web/app/customer/media/factory/page.tsx`
**修复**：视频生成改为调用后端 `/api/ai-chat/video` API，失败时给出明确提示

## 问题 3：Report 页面导出记录使用模拟数据
**修改文件**：
- `web/app/customer/report/page.tsx` — 改为从 `/api/export/history` 和 `/api/export/stats` 获取真实数据
- `server/src/routes/export.ts` — 新增 `/history` 和 `/stats` 两个端点

## 问题 4：Help 页面客服机器人未接入 AI
**修改文件**：`web/app/help/page.tsx`
**修复**：智能客服接入 `/api/ai-chat/chat` API，使用 qwen-turbo 模型，失败时给出友好降级提示

## 问题 5：Subscribe 页面支付回调模拟跳转
**修改文件**：`web/app/account/subscribe/page.tsx`
**修复**：移除模拟跳转 `setTimeout` 逻辑，有真实支付链接时跳转，否则提示用户完成支付后刷新状态

## 问题 6：Employees 页面 currentUserId = 'demo-user'
**修改文件**：`web/app/customer/employees/page.tsx`
**修复**：改用 `useAuth()` context 获取真实用户 ID

## 附加修复
- `web/app/customer/tools/tianyancha/page.tsx` — 修正注释（"模拟API调用" → "调用天眼查API"）
