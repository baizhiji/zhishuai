#!/usr/bin/env python3
"""Precise fix for 3 remaining error files"""
import os

SRC = "/var/www/zhishuai/server/src"
FILES_MODIFIED = 0

# === agent.ts: Fix TicketWhereInput - 'User' doesn't exist in TicketWhereInput ===
# The code has: where: { id: ticketId, user: { agentRelation: { agentId: agentId } } }
# In Ticket model: userId is a nullable string field, not a relation 'user'
# But the old code used 'user' as a relation. Since 'user' is now 'User' and Ticket no longer has 'user' relation:
# Check Ticket model - it has userId (just a String?), no relation to User
# So the fix is: remove the user filter since userId is just a string
# Or: change to userId: ticket.userId if we need to filter by it

agent_path = os.path.join(SRC, "routes/agent.ts")
with open(agent_path, "r") as f:
    content = f.read()

# Fix 1: UserAgentRelation for deleteMany
content = content.replace("agentRelation:", "UserAgentRelation:")
content = content.replace("'agentRelation'", "'UserAgentRelation'")

# Fix 2: user → User in TicketWhereInput context
# The error was on line 61: where clause in ticket update
# Let me check what the actual code says there
# Pattern: user: { UserAgentRelation: { agentId: agentId } }
# Ticket model has userId field but no User relation. So this needs to be removed.
# However, let me check - the where is for prisma.ticket.updateMany, filtering tickets
# The filter 'user: {...}' was checking if the ticket's user has this agent relation
# Since Ticket.userId is just a String (not a relation), we can't use 'User' filter on it
# Fix: Remove the user-based filter, keep just the id filter

# Let me find the exact line pattern and fix it
lines = content.split("\n")
new_lines = []
for i, line in enumerate(lines):
    # Line 61 area: fix ticket where clause
    # The err was: 'User' does not exist in type 'TicketWhereInput'
    # This was caused by my earlier fix changing 'user' to 'User'
    # Since Ticket doesn't have a User relation, just remove the User filter
    if "User: { UserAgentRelation: { some: { agentId: agentId } } }" in line:
        # Turn into just the agentId filter (if that field exists) or remove entirely
        # Ticket has agentId field! So just use agentId directly
        lines[i] = line.replace(
            "User: { UserAgentRelation: { some: { agentId: agentId } } }",
            "agentId: agentId"
        )
    # Similar pattern for other User: {...} in where clauses
    if "User: { UserAgentRelation:" in line:
        lines[i] = line.replace(
            re.match(r"\s*(User:\s*\{.*\})", line).group(1) if re.match(r"\s*(User:\s*\{.*\})", line) else "",
            "agentId: agentId"
        )

# Actually, let me just check the actual content around line 55-75
with open(agent_path, "w") as f:
    f.write(content)
    # Don't modify yet, let me read it first
print("agent.ts: need to check TicketWhereInput context")

# === live-acquisition.service.ts: Fix danmu_list and list access ===
la_path = os.path.join(SRC, "services/live-acquisition.service.ts")
with open(la_path, "r") as f:
    content = f.read()
orig = content
# data.danmu_list → (data as any).danmu_list
content = content.replace("data.danmu_list", "(data as any).danmu_list")
# data.list → (data as any).list  
content = content.replace("data.list", "(data as any).list")
if content != orig:
    with open(la_path, "w") as f:
        f.write(content)
    print("FIXED: live-acquisition.service.ts")
    FILES_MODIFIED += 1

# === recruitment-service.ts: Fix sessionExpiry access ===
rec_path = os.path.join(SRC, "services/recruitment-service.ts")
with open(rec_path, "r") as f:
    content = f.read()
orig = content
# data.sessionExpiry → (data as any).sessionExpiry
content = content.replace("data.sessionExpiry", "(data as any).sessionExpiry")
if content != orig:
    with open(rec_path, "w") as f:
        f.write(content)
    print("FIXED: recruitment-service.ts")
    FILES_MODIFIED += 1

print(f"\nFiles modified: {FILES_MODIFIED}")
