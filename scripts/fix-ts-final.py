#!/usr/bin/env python3
"""
Final round: Fix ALL remaining TypeScript errors
"""
import os, re

SRC = "/var/www/zhishuai/server/src"
SCHEMA = "/var/www/zhishuai/server/prisma/schema.prisma"

files_modified = 0

# ============================================================
# Part A: Schema fixes
# ============================================================
def fix_schema(content):
    # Fix all "id String @id" without default → add @default(uuid())
    content = re.sub(r"(id\s+String\s+@id)(?!\s+@default)", r"\1 @default(uuid())", content)
    
    # Fix all "updatedAt DateTime" without @updatedAt  
    content = re.sub(r"(updatedAt\s+DateTime)(?!\s+@)", r"\1 @updatedAt", content)
    
    return content

# ============================================================
# Part B: Code fixes
# ============================================================

def fix_admin_agents(content):
    """admin-agents.ts: children, agent relation fixes"""
    # 'children' → 'UserAgentRelation' in include/select
    content = content.replace("'children'", "'UserAgentRelation'")
    content = content.replace('"children"', '"UserAgentRelation"')
    
    # Fix bare 'agent' in object literals within prisma queries
    # Pattern: include: { ... agent: ... } → include: { ... Agent: ... }
    content = re.sub(r"(\binclude\s*:\s*\{[^}]*?)agent\s*:", r"\1Agent:", content)
    content = re.sub(r"(\bselect\s*:\s*\{[^}]*?)agent\s*:", r"\1Agent:", content)
    
    return content

def fix_acquisition(content):
    """acquisition.ts: followups, task relations"""
    # followups → _count (with proper structure)
    content = content.replace(
        "followups: { select: { id: true } }",
        "_count: { select: { id: true } }"
    )
    content = content.replace("'followups'", "'_count'")
    content = content.replace('"followups"', '"_count"')
    
    # Remove 'task' from include
    content = re.sub(r",?\s*'task'\s*:\s*\{[^}]*\}", "", content)
    
    return content

def fix_model_output_type(content):
    """Fix 'professional' capability type issues"""
    content = content.replace(
        'capability: "professional"', 
        'capability: "professional" as ModelCapability'
    )
    return content

def fix_tianyancha(content):
    """Fix tianyancha.service.ts - cast unknown types"""
    content = content.replace("data.items", "(data as any).items")
    content = content.replace("data.total", "(data as any).total")
    return content

# Apply code fixes
file_map = {
    os.path.join(SRC, "routes/admin-agents.ts"): fix_admin_agents,
    os.path.join(SRC, "routes/acquisition.ts"): fix_acquisition,
    os.path.join(SRC, "services/model-registry.ts"): fix_model_output_type,
    os.path.join(SRC, "services/multi-model-orchestrator.ts"): fix_model_output_type,
    os.path.join(SRC, "services/tianyancha.service.ts"): fix_tianyancha,
}

for path, fix_fn in file_map.items():
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            original = f.read()
        fixed = fix_fn(original)
        if fixed != original:
            with open(path, "w", encoding="utf-8") as f:
                f.write(fixed)
            print(f"FIXED: {path.replace(SRC+'/','')}")
            files_modified += 1

# Schema
with open(SCHEMA, "r", encoding="utf-8") as f:
    orig = f.read()
new = fix_schema(orig)
if new != orig:
    with open(SCHEMA, "w", encoding="utf-8") as f:
        f.write(new)
    print("FIXED: schema.prisma")
    files_modified += 1

print(f"\nFiles modified: {files_modified}")
print("Done! Run: npx prisma generate && npx tsc --noEmit")
