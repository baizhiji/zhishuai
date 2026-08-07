#!/bin/bash
# Round 2: Fix remaining TypeScript errors after Prisma schema change
set -e
SRC="/var/www/zhishuai/server/src"

echo "=== Phase 1: 处理死代码引用 ==="

# dashboard-stats.ts: 移除已删除 customer-dashboard 的导入, 移除 crmCustomer/publishedContent 引用
sed -i "/from '..\/services\/customer-dashboard'/d" "$SRC/routes/dashboard-stats.ts"
sed -i "/from '..\/services\/dashboard-business-lines'/d" "$SRC/routes/dashboard-stats.ts"

# dashboard-service.ts 和 dashboard-business-lines.ts: 引用死模型, 整体删除
rm -f "$SRC/services/dashboard-service.ts"
rm -f "$SRC/services/dashboard-business-lines.ts"

echo "Phase 1 Done."

echo "=== Phase 2: 修复 Prisma 关系名/字段名（活跃代码）==="

# admin-agents.service.ts
sed -i "s/'user'/'User'/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/agentRelations:/UserAgentRelation:/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/\.agentRelations\b/.UserAgentRelation/g" "$SRC/services/admin-agents.service.ts"
sed -i "s/matrixAccounts:/_count:/g" "$SRC/services/admin-agents.service.ts"

# agent.service.ts
sed -i "s/'user'/'User'/g" "$SRC/services/agent.service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/agent.service.ts"
sed -i "s/agentRelations:/UserAgentRelation:/g" "$SRC/services/agent.service.ts"
sed -i "s/\.agentRelations\b/.UserAgentRelation/g" "$SRC/services/agent.service.ts"
sed -i "s/agentRelation:/UserAgentRelation:/g" "$SRC/services/agent.service.ts"
sed -i "s/, agentId:/, Agent: { select: { id: true } }/g" "$SRC/services/agent.service.ts"

# agent.ts routes
sed -i "s/'agentId'/'Agent'/g" "$SRC/routes/agent.ts"
sed -i "s/agentId: true/Agent: { select: { id: true } }/g" "$SRC/routes/agent.ts"
sed -i "s/\.agentRelations\b/.UserAgentRelation/g" "$SRC/routes/agent.ts"
sed -i "s/\bagentId\b/Agent: { select: { id: true } }/g" "$SRC/routes/agent.ts"

# admin-agents.ts routes
sed -i "s/'agentId'/'Agent'/g" "$SRC/routes/admin-agents.ts"
sed -i "s/agentId: true/Agent: { select: { id: true } }/g" "$SRC/routes/admin-agents.ts"
sed -i "s/\.agentRelations\b/.UserAgentRelation/g" "$SRC/routes/admin-agents.ts"

# auth.ts / auth.service.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/auth.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/auth.service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/auth.service.ts"

# recruitment-service.ts
sed -i "s/'user'/'User'/g" "$SRC/services/recruitment-service.ts"

# acquisition files
sed -i "s/'agent'/'Agent'/g" "$SRC/services/acquisition-service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/acquisition-service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/data-acquisition.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/data-acquisition.service.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/services/live-acquisition.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/live-acquisition.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/acquisition.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/data-acquisition.ts"

# media.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/media.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/media.ts"

# statistics.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/statistics.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/statistics.ts"

# dashboard-stats.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/dashboard-stats.ts"
sed -i "s/'leads'/'Leads'/g" "$SRC/routes/dashboard-stats.ts"

# user-features.ts
sed -i "s/'user'/'User'/g" "$SRC/routes/user-features.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/user-features.ts"

# AI files
sed -i "s/'user'/'User'/g" "$SRC/services/ai-pipeline.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/ai-chat.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/ai-client.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/multi-model-orchestrator.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/model-registry.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/hot-topics.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/digital-human.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/chat-history.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/amap.service.ts"
sed -i "s/'user'/'User'/g" "$SRC/services/content-creativity.service.ts"

# Other routes
sed -i "s/'user'/'User'/g" "$SRC/routes/employee.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/ticket.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/share.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/export.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/script.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/ai-chat.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/oauth.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/notification.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/voice-clone.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/digital-human.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/materials.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/announcements.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-dashboard.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-logs.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-features.ts"
sed -i "s/'user'/'User'/g" "$SRC/routes/admin-api-providers.ts"
sed -i "s/'agent'/'Agent'/g" "$SRC/routes/admin-api-providers.ts"

# employee.service
sed -i "s/'user'/'User'/g" "$SRC/services/employee.service.ts"

# social-account.service
sed -i "s/'user'/'User'/g" "$SRC/services/social-account.service.ts"

# user-api-key.service
sed -i "s/'user'/'User'/g" "$SRC/services/user-api-key.service.ts"

echo "Phase 2 Done."

echo "=== Phase 3: 修复 LoginLog 缺失字段引用 ==="
# auth.service.ts 中 LoginLog 模型没有 action/userAgent/createdAt 字段
# 移除对这些字段的引用
sed -i "s/action: 'login',//g" "$SRC/services/auth.service.ts"
sed -i "s/action: //g" "$SRC/services/auth.service.ts"
sed -i "s/userAgent: userAgent,//g" "$SRC/services/auth.service.ts"
sed -i "s/userAgent: userAgent//g" "$SRC/services/auth.service.ts"

echo "Phase 3 Done."

echo "=== 验证结果 ==="
cd /var/www/zhishuai/server
npx tsc --noEmit 2>&1 | grep "error TS" | awk -F'(' '{print $1}' | sort | uniq -c | sort -rn
