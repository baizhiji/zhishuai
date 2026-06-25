# 5个问题修复计划

## 问题 0：API Key 访问权限控制（新增需求）
**现状**：getUserApiKey fallback 到环境变量，所有用户都能用平台 Key
**需求**：只有管理员 18601655222 才能用平台 Key，普通用户没配置自己的 Key 就报错
**修复**：
1. 修改 ai-chat.ts 的 getUserApiKey：非 admin 不 fallback 到环境变量
2. 修改 code-assistant.ts 的 getUserApiKey：同上
3. 修改 pipeline.service.ts 的 callProvider：非 admin 任务不使用平台 Key

## 问题 1：SSL 证书域名不匹配
**修复**：需要在服务器 Nginx 配置中修复 api.baizhiji.net 的 SSL 证书

## 问题 2：content factory 视频生成使用 placeholder
**修复**：视频生成改为调用后端 AI 视频生成 API

## 问题 3：report 页面导出记录使用模拟数据
**修复**：改为从后端 API 获取真实导出记录

## 问题 4：help 页面客服机器人未接入 AI
**修复**：接入 /api/ai-chat 的 AI 对话能力

## 问题 5：subscribe 页面支付回调模拟跳转
**修复**：移除模拟跳转逻辑，只保留真实支付流程

## 问题 6：employees 页面 currentUserId = 'demo-user'
**修复**：从 auth context 获取真实用户 ID
