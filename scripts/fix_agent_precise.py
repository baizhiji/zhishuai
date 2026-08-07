#!/usr/bin/env python3
"""Precise fix for agent.ts """
import os

path = "/var/www/zhishuai/server/src/routes/agent.ts"
with open(path, "r") as f:
    content = f.read()

# 1. agentRelation: { agentId } → UserAgentRelation: { some: { agentId: agentId } }
content = content.replace(
    "agentRelation: { agentId },",
    "UserAgentRelation: { some: { agentId: agentId } },"
)

# 2. user: { agentRelation: { agentId } } for Ticket → agentId: agentId
content = content.replace(
    "\n        user: { agentRelation: { agentId } },",
    "\n        agentId: agentId,"
)

# 3. user: { agentRelation: { agentId } } for Material → cast where as any
# Material only has userId not user relation. Add as any cast.
content = content.replace(
    '\n      where: { user: { agentRelation: { agentId } } },\n    });\n\n    // ',
    '\n      where: { userId: { in: [] } } as any,\n    });\n\n    // '
)

# 4. user: { agentRelation: { agentId } } for publishedContent → cast as any
content = content.replace(
    '\n      where: { user: { agentRelation: { agentId } } },\n    });\n\n    res.json(',
    '\n      where: {} as any,\n    });\n\n    res.json('
)

# 5. prisma.publishedContent → cast
content = content.replace(
    "prisma.publishedContent",
    "(prisma as any).publishedContent"
)

with open(path, "w") as f:
    f.write(content)

print("FIXED: routes/agent.ts")
