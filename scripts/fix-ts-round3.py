#!/usr/bin/env python3
"""Round 3: Precise Prisma field name fixes"""
import re, os

SRC = "/var/www/zhishuai/server/src"

# === Fix admin-agents.ts ===
path = os.path.join(SRC, "routes/admin-agents.ts")
with open(path, "r") as f:
    content = f.read()
# children → UserAgentRelation
content = content.replace("children: {", "UserAgentRelation: {")
# Fix bare 'agent:' key in include/select blocks  
content = re.sub(r"'agent'\s*:\s*\{", "'Agent': {", content)
with open(path, "w") as f:
    f.write(content)
print("FIXED: routes/admin-agents.ts")

# === Fix acquisition.ts ===
path = os.path.join(SRC, "routes/acquisition.ts")
with open(path, "r") as f:
    content = f.read()

# 1. followups in _count.select → LeadFollowup
content = content.replace(
    "_count: { select: { followups: true } }",
    "_count: { select: { LeadFollowup: true } }"
)
# 2. lead._count.followups → lead._count.LeadFollowup  
content = content.replace(
    "lead._count.followups",
    "lead._count.LeadFollowup"
)
# 3. task in include → AcquisitionTask
content = content.replace(
    "task: { select: { title: true } }",
    "AcquisitionTask: { select: { title: true } }"
)
# 4. followups in include → LeadFollowup
content = content.replace(
    "followups: { orderBy: { createdAt: 'desc' } }",
    "LeadFollowup: { orderBy: { createdAt: 'desc' } }"
)

with open(path, "w") as f:
    f.write(content)
print("FIXED: routes/acquisition.ts")

print("Done!")
