# 智枢AI商用就绪实施计划

**创建日期**: 2026-08-04

## P0-1: AI创作工厂路由整合 (预计1-2天)

将以下Mock服务切换到真实的ai-client (腾讯云TokenHub/阿里云百炼):
1. `server/src/routes/ai-enhanced.ts` — 标题生成、脚本生成、标签推荐、文章生成
2. `server/src/services/ai-workflow.ts` — 多步骤工作流
3. `server/src/services/multimodal.service.ts` — 多模态生成

## P0-2: 推荐分享归因链路 (预计3-5天)

核心修复:
1. 二维码嵌入inviter_id (使用ShareQrCode的json字段)
2. 扫码记录scannerId到ShareRecord
3. 多级链式追踪(A→B→C)
4. 分阶段佣金计算

## P0-3: Playwright浏览器自动化 (预计5-7天)

1. 提交playwright.service.ts到Git仓库
2. 实现MediaPlatformPublisher发布器
3. 集成到playwright-bridge路由
4. 注册路由到index.ts

## P1-1: 智能招聘自动化管线 (预计5-7天)

1. 实现招聘状态机
2. 自动匹配算法
3. 自动沟通消息发送
4. 去重逻辑
5. 超时处理

## P1-2: 智能获客平台集成 (预计5-7天)

1. 平台数据采集
2. 频次控制
3. 黑名单
4. 自动发送

## P1-3: 安全加固 (预计2-3天)

1. 审计日志
2. Rate Limiting
3. 数据隔离验证
4. 敏感操作记录

## P2-1: 数据合规 (预计3-5天)

1. 用户注销数据清理
2. Webhook验签
3. OAuth标准流程

## P2-2: 性能与监控 (预计2-3天)

1. 排队机制
2. 连接池优化
3. 错误率告警
4. 队列积压告警
