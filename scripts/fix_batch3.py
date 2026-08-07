#!/usr/bin/env python3
import os, re

BASE = "/var/www/zhishuai/server/src"

fixes = [
    # (file, old_pattern, new_pattern, description)
    ("routes/agent.ts", r"\.featureSubSwitch\b", ".FeatureSubSwitch", "featureSubSwitch property access"),
    ("routes/share.ts", "ShareRecordId", "shareRecordId", "ShareRecordId field"),
    ("routes/statistics.ts", r"\.user\b(?!Id)", ".User", ".user → .User on result"),
    ("routes/script.ts", "contentTemplate:", "ChatMessage:", "contentTemplate include"),
    ("routes/dashboard-stats.ts", r"\.leads\(", "._count.leads(", "leads → _count"),
    ("routes/dashboard-stats.ts", r"aggregate\(\{", "aggregate({} as any).(", "aggregate args"),
    ("services/acquisition-service.ts", r"\.task\(", "._count.task(", "task → _count"),
    ("services/acquisition-service.ts", r"task: \{", "_count: {", "task include"),
    ("services/admin-agents.service.ts", r"children:", "other_Agent:", "children → other_Agent"),
    ("services/admin-agents.service.ts", r"parent:", "Agent:", "parent → Agent"),
    ("services/auth.service.ts", "action: true", "status: true", "action→status"),
    ("services/auth.service.ts", "createdAt: 'desc'", "loginAt: 'desc'", "createdAt→loginAt"),
    ("services/chat-history.service.ts", "chatMessages:", "ChatMessage:", "chatMessages→ChatMessage"),
]

for filepath, old, new, desc in fixes:
    path = os.path.join(BASE, filepath)
    if not os.path.exists(path):
        print(f"  [SKIP] {filepath} not found")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    count = len(re.findall(old, content)) if old.startswith(r"\.") else content.count(old)
    if count == 0:
        print(f"  [OK] {filepath}: {desc} - already fixed")
        continue
    content = re.sub(old, new, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [OK] {filepath}: {desc} ({count} occurrences)")

print("Done!")
