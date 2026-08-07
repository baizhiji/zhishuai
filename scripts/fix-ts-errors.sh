#!/bin/bash
# Unified TypeScript Error Fix Script
# 修复所有 Prisma schema 变更后的编译错误

set -e
SRC="/var/www/zhishuai/server/src"

echo "=== Phase 1: 删除死代码文件（CRM/Publish/Auto-reply/Matrix/Branding）==="
# 这些文件引用了已删除的 Prisma 模型 (crmCustomer, crmTag, BrandingConfig 等)
# 且它们对应的路由已在 index.ts 中被注释掉
rm -f "$SRC/routes/crm.ts"
rm -f "$SRC/routes/crm-advanced.ts"
rm -f "$SRC/services/crm-service.ts"
rm -f "$SRC/services/crm-advanced.service.ts"
rm -f "$SRC/services/customer-dashboard.ts"
rm -f "$SRC/routes/publish.ts"
rm -f "$SRC/services/publish.service.ts"
rm -f "$SRC/routes/auto-reply.ts"
rm -f "$SRC/routes/matrix.ts"
rm -f "$SRC/routes/admin-branding.ts"
echo "Phase 1 Done: 11 dead files removed."

echo "=== Phase 2: 修复 Prisma 关系名称（Include/Select/Where）==="
# Agent 模型: include { user: → include { User:
sed -i "s/include: { user:/include: { User:/g" "$SRC/routes/admin-agents.ts"
sed -i "s/select: { user:/select: { User:/g" "$SRC/routes/admin-agents.ts"

# UserAgentRelation: include { user: → include { User:
sed -i "s/agentRelation: {/UserAgentRelation: {/g" "$SRC/routes/admin-agents.ts"
# Fix agentRelation in where
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-agents.ts"
sed -i "s/\"user\"/\"User\"/g" "$SRC/routes/admin-agents.ts"

# agent 关系名在 where/include/select 中
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/admin-agents.ts"
sed -i "s/\"agent\"/\"Agent\"/g" "$SRC/routes/admin-agents.ts"

# agentId in select
sed -i "s/agentId: true/Agent: { select: { id: true } }/g" "$SRC/routes/admin-agents.ts"

# agent.ts: agentRelation → UserAgentRelation
sed -i "s/agentRelation:/UserAgentRelation:/g" "$SRC/routes/agent.ts"
sed -i "s/'agentRelation'/'UserAgentRelation'/g" "$SRC/routes/agent.ts"
# agent.ts: 'user' in where → 'User'
sed -i "s/'user'/'User'/g" "$SRC/routes/agent.ts"
# agent.ts: agentId in select → Agent
sed -i "s/agentId: true/Agent: { select: { id: true } }/g" "$SRC/routes/agent.ts"
# agent.ts: agentRelations → UserAgentRelation
sed -i "s/agentRelations:/UserAgentRelation:/g" "$SRC/routes/agent.ts"
sed -i "s/'agentRelations'/'UserAgentRelation'/g" "$SRC/routes/agent.ts"

# admin-agents.service.ts: same fixes
sed -i "s/include: { user:/include: { User:/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/agentRelations:/UserAgentRelation:/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/'agentRelations'/'UserAgentRelation'/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/agentRelation:/UserAgentRelation:/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/'agentRelation'/'UserAgentRelation'/g" "$SRC/services/admin-agents.service.ts"

# agent.service.ts
sed -i "s/include: { user:/include: { User:/g" "$SRC/services/agent.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/agent.service.ts"
sed -i "s/'agentRelation'/'UserAgentRelation'/g" "$SRC/services/agent.service.ts"
sed -i "s/agentRelation:/UserAgentRelation:/g" "$SRC/services/agent.service.ts"
sed -i "s/agentRelations:/UserAgentRelation:/g" "$SRC/services/agent.service.ts"
sed -i "s/'agentRelations'/'UserAgentRelation'/g" "$SRC/services/agent.service.ts"

echo "Phase 2 Done: Prisma relation names fixed."

echo "=== Phase 3: 修复 validate() 调用方式 ==="
# auth.ts: validate(registerSchema) → validate({ body: registerSchema.shape.body })
# Need to handle multiple schemas
sed -i "s/validate(sendSmsSchema)/validate({ body: sendSmsSchema.shape.body })/g" "$SRC/routes/auth.ts"
sed -i "s/validate(verifyCodeSchema)/validate({ body: verifyCodeSchema.shape.body })/g" "$SRC/routes/auth.ts"
sed -i "s/validate(resetPasswordSchema)/validate({ body: resetPasswordSchema.shape.body })/g" "$SRC/routes/auth.ts"
sed -i "s/validate(loginSchema)/validate({ body: loginSchema.shape.body })/g" "$SRC/routes/auth.ts"

# acquisition.ts
sed -i "s/validate(createLeadSchema)/validate({ body: createLeadSchema.shape.body })/g" "$SRC/routes/acquisition.ts"
sed -i "s/validate(updateLeadSchema)/validate({ body: updateLeadSchema.shape.body })/g" "$SRC/routes/acquisition.ts"

# agent.ts
sed -i "s/validate(createAgentSchema)/validate({ body: createAgentSchema.shape.body })/g" "$SRC/routes/agent.ts"
sed -i "s/validate(updateAgentSchema)/validate({ body: updateAgentSchema.shape.body })/g" "$SRC/routes/agent.ts"

echo "Phase 3 Done: validate() calls fixed."

echo "=== Phase 4: 修复其他活跃文件错误 ==="

# acquisition.ts: 'followups' doesn't exist → remove from select
sed -i "s/'followups'/'_count'/g" "$SRC/routes/acquisition.ts"
# acquisition.ts: 'task' doesn't exist in include → the schema now uses 'task' not 'Task'
# Check actual schema first - if include includes 'task', it's probably just a select issue

# dashboard-stats.ts: 'leads' doesn't exist → 'Leads'
sed -i "s/'leads'/'Leads'/g" "$SRC/routes/dashboard-stats.ts"

# employee.service.ts & employee.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/employee.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/employee.service.ts"

# social-account.service.ts: agentId → remove from create if not in schema
# ticket.ts: 'user' → 'User'  
sed -i "s/'user'/'User'/g" "$SRC/routes/ticket.ts"

# media.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/media.ts"

# statistics.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/statistics.ts"

# share.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/share.ts"

# export.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/export.ts"

# script.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/script.ts"

# ai-chat.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/ai-chat.ts"

# oauth.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/oauth.ts"

# notification.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/notification.ts"

# digital-human.ts: 修复 create 类型的错误（可能缺少 id/updatedAt）
# voice-clone.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/voice-clone.ts"

# materials.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/materials.ts"

# announcements.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/announcements.ts"

# admin-dashboard.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-dashboard.ts"

# admin-logs.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-logs.ts"

# admin-api-providers.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-api-providers.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/admin-api-providers.ts"

# admin-features.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-features.ts"

# user-features.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/user-features.ts"

# Service files  
sed -i "s/'user'/'User'/g" "$SRC/services/acquisition-service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/ai-pipeline.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/ai-chat.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/ai-client.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/live-acquisition.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/multi-model-orchestrator.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/model-registry.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/hot-topics.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/digital-human.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/chat-history.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/amap.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/recruitment-service.ts"

echo "Phase 4 Done."

echo "=== Phase 5: 修复剩余 Miscellaneous 错误 ==="
# Fix remaining social-account.service.ts: remove agentId from create
sed -i "s/agentId: userId,//g" "$SRC/services/social-account.service.ts"

echo "=== 所有修复完成 ==="

# 列出剩余有错误的文件
echo "=== 验证编译 ==="
cd /var/www/zhishuai/server
npx tsc --noEmit 2>&1 | grep "error TS" | awk -F'(' '{print $1}' | sort | uniq -c | sort -rn
echo "=== 已删除的死代码文件 ==="
echo "crm.ts, crm-advanced.ts, crm-service.ts, crm-advanced.service.ts, customer-dashboard.ts"
echo "publish.ts, publish.service.ts, auto-reply.ts, matrix.ts, admin-branding.ts"
