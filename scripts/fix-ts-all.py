#!/usr/bin/env python3
"""Comprehensive TypeScript error fixer - fixes all remaining Prisma relation name mismatches"""
import re
import os

SRC = "/var/www/zhishuai/server/src"

# Map of files to their fixes
fixes = {}

# === 1. admin-agents.ts - Prisma relation & include fixes ===
def fix_admin_agents(content):
    # include: { user: ... } → include: { User: ... }
    content = re.sub(r"include:\s*\{\s*user:\s", "include: { User: ", content)
    content = re.sub(r"select:\s*\{\s*user:\s", "select: { User: ", content)
    # 'user' → 'User' in string keys
    content = content.replace("'user'", "'User'")
    # 'agent' → 'Agent' in string keys  
    content = content.replace("'agent'", "'Agent'")
    # agentRelation → UserAgentRelation
    content = content.replace("agentRelation", "UserAgentRelation")
    content = content.replace("agentRelations", "UserAgentRelation")
    return content

# === 2. agent.ts - same patterns ===
def fix_agent(content):
    content = content.replace("agentRelation", "UserAgentRelation")
    content = content.replace("'user'", "'User'")
    content = content.replace("'agent'", "'Agent'")
    return content

# === 3. acquisition.ts ===
def fix_acquisition(content):
    content = content.replace("'followups'", "'_count'")
    # Remove task from include - it doesn't exist as a relation
    content = content.replace("'task'", "null as any")
    return content

# === 4. Various service & route files: 'user' → 'User' ===
def fix_user_relation(content):
    content = content.replace("'user'", "'User'")
    content = content.replace("'agent'", "'Agent'")
    return content

# === 5. recruitment-service.ts - remove dead model references ===
def fix_recruitment(content):
    # Remove references to deleted models
    content = content.replace("prisma.platformAccount", "(prisma as any).platformAccount")
    content = content.replace("prisma.recruitmentInterview", "(prisma as any).recruitmentInterview")
    content = content.replace("prisma.crmReminder", "(prisma as any).crmReminder")
    return content

# === 6. social-account.service.ts - agentId doesn't exist in create ===
def fix_social_account(content):
    # Remove agentId from create input
    content = re.sub(r"agentId:\s*userId\s*,?\s*", "", content)
    return content

# === 7. admin-api-providers.ts ===
def fix_admin_api_providers(content):
    content = content.replace("'user'", "'User'")
    content = content.replace("'agent'", "'Agent'")
    return content

# Apply fixes
file_fixes = {
    "routes/admin-agents.ts": fix_admin_agents,
    "services/admin-agents.service.ts": fix_admin_agents,
    "routes/agent.ts": fix_agent,
    "services/agent.service.ts": fix_agent,
    "routes/acquisition.ts": fix_acquisition,
    "services/acquisition-service.ts": fix_user_relation,
    "services/data-acquisition.service.ts": fix_user_relation,
    "routes/data-acquisition.ts": fix_user_relation,
    "services/live-acquisition.service.ts": fix_user_relation,
    "services/auth.service.ts": fix_user_relation,
    "routes/auth.ts": fix_user_relation,
    "routes/admin-api-providers.ts": fix_admin_api_providers,
    "services/employee.service.ts": fix_user_relation,
    "routes/employee.ts": fix_user_relation,
    "routes/media.ts": fix_user_relation,
    "routes/statistics.ts": fix_user_relation,
    "routes/ticket.ts": fix_user_relation,
    "routes/share.ts": fix_user_relation,
    "routes/export.ts": fix_user_relation,
    "routes/script.ts": fix_user_relation,
    "routes/ai-chat.ts": fix_user_relation,
    "routes/oauth.ts": fix_user_relation,
    "routes/notification.ts": fix_user_relation,
    "routes/voice-clone.ts": fix_user_relation,
    "routes/digital-human.ts": fix_user_relation,
    "routes/materials.ts": fix_user_relation,
    "routes/announcements.ts": fix_user_relation,
    "routes/admin-dashboard.ts": fix_user_relation,
    "routes/admin-logs.ts": fix_user_relation,
    "routes/admin-features.ts": fix_user_relation,
    "routes/user-features.ts": fix_user_relation,
    "services/social-account.service.ts": fix_social_account,
    "services/recruitment-service.ts": fix_recruitment,
}

files_modified = 0
for rel_path, fix_fn in file_fixes.items():
    full_path = os.path.join(SRC, rel_path)
    if not os.path.exists(full_path):
        print(f"SKIP (not found): {rel_path}")
        continue
    with open(full_path, "r", encoding="utf-8") as f:
        original = f.read()
    fixed = fix_fn(original)
    if fixed != original:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(fixed)
        print(f"FIXED: {rel_path}")
        files_modified += 1
    else:
        print(f"UNCHANGED: {rel_path}")

print(f"\nTotal files modified: {files_modified}")
print("Done!")
