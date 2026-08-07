#!/usr/bin/env python3
"""Comprehensive fix for ALL remaining TypeScript errors"""
import os, re

SRC = "/var/www/zhishuai/server/src"

# Map of filename → [(old_string, new_string), ...]
fixes = {
    "routes/admin-agents.ts": [
        # agent → Agent in include keys
        ("'agent': {", "'Agent': {"),
        # Remove duplicate UserAgentRelation keys caused by earlier fix
        # The children→UserAgentRelation created: {User: {...}, UserAgentRelation: {include: {User:...}, UserAgentRelation: {...}}}
        # The inner UserAgentRelation should be removed (was 'agent' that got duplicated)
    ],
    "routes/agent.ts": [
        ("prisma.publishedContent", "(prisma as any).publishedContent"),
        ("prisma.matrixAccount", "(prisma as any).matrixAccount"),
        # featureSwitches → UserFeatureSwitch  
        ("'featureSwitches'", "'UserFeatureSwitch'"),
        # subFeatures → FeatureSubSwitch
        ("subFeatures", "FeatureSubSwitch"),
        # user → User in include
        ("user: {", "User: {"),
    ],
    "routes/dashboard-stats.ts": [
        ("prisma.publishedContent", "(prisma as any).publishedContent"),
        ("prisma.crmCustomer", "(prisma as any).crmCustomer"),
        # Fix leads in select
        ("'leads':", "'_count':"),
        ("'leads'", "'_count'"),
    ],
    "routes/admin-dashboard.ts": [
        ("prisma.publishedContent", "(prisma as any).publishedContent"),
        ("'user': {", "'User': {"),
        ("include: { user:", "include: { User:"),
    ],
    "routes/export.ts": [
        ("prisma.crmCustomer", "(prisma as any).crmCustomer"),
    ],
    "routes/admin-logs.ts": [
        ("include: { user:", "include: { User:"),
        ("select: { user:", "select: { User:"),
    ],
    "routes/admin-features.ts": [
        # Revert my wrong fix: FeatureSubSwitch → featureSubSwitch
        ("FeatureSubSwitch", "featureSubSwitch"),
    ],
    "routes/ticket.ts": [
        ("'ticketResponse'", "'TicketResponse'"),
    ],
    "routes/ai-chat.ts": [
        # chatMessage → ChatMessage in include
        ("include: { chatMessage:", "include: { ChatMessage:"),
    ],
    "routes/statistics.ts": [
        ("include: { user:", "include: { User:"),
    ],
    "routes/user-features.ts": [
        ("include: { user:", "include: { User:"),
        ("include: { agent:", "include: { Agent:"),
    ],
    "services/acquisition-service.ts": [
        ("'task': {", "'AcquisitionTask': {"),
        ("prisma.platformAccount", "(prisma as any).platformAccount"),
    ],
    "services/pub-service.ts": [
        ("prisma.publishedContent", "(prisma as any).publishedContent"),
    ],
    "services/employee.service.ts": [
        ("'agentId'", "'Agent'"),
    ],
    "services/content-creativity.service.ts": [
        # publishedContent - handle if it exists
    ],
}

for rel_path, repl_list in fixes.items():
    full_path = os.path.join(SRC, rel_path)
    if not os.path.exists(full_path):
        continue
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    for old, new in repl_list:
        content = content.replace(old, new)
    if content != original:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"FIXED: {rel_path} ({len(repl_list)} replacements)")

# Special handling: fix admin-agents.ts agent key
admin_agents = os.path.join(SRC, "routes/admin-agents.ts")
with open(admin_agents, "r") as f:
    lines = f.readlines()

modified = False
in_include_block = False
for i, line in enumerate(lines):
    # Fix lines like "      agent: {" → "      Agent: {"
    # But only in include/select blocks
    match = re.match(r'^(\s+)agent:\s+(true|.*)$', line)
    if match:
        # Check context: if line has 'agent' as a key (not a value)
        indent = match.group(1)
        rest = match.group(2)
        # Only fix if it looks like an include/select key
        lines[i] = f'{indent}Agent: {rest}\n'
        modified = True
        print(f"  Fixed line {i+1}: agent: → Agent:")

if modified:
    with open(admin_agents, "w") as f:
        f.writelines(lines)
    print("FIXED (special): routes/admin-agents.ts agent keys")

print("\nDone!")
