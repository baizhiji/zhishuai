"""Targeted schema fix: rename specific relation fields to match code expectations."""
import re

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Map from v4-generated camelCase name to code-expected name
# These are the names the code uses that differ from simple camelCase
replacements = [
    # AcquisitionTask model: acquisitionLead[] -> leads[]
    (r'  acquisitionLead\s+AcquisitionLead\[\]', '  leads AcquisitionLead[]'),
    # AcquisitionLead model: leadFollowup[] -> followups[]
    (r'  leadFollowup\s+LeadFollowup\[\]', '  followups LeadFollowup[]'),
    # AcquisitionLead model: acquisitionTask? -> task?
    (r'  acquisitionTask\s+AcquisitionTask\?\s+@relation', '  task AcquisitionTask? @relation'),
    # Agent model: userAgentRelation[] -> agentRelations[]
    (r'  userAgentRelation\s+UserAgentRelation\[\]', '  agentRelations UserAgentRelation[]'),
    # User model: userAgentRelation? -> agentRelation?
    (r'  userAgentRelation\s+UserAgentRelation\?\s+@relation', '  agentRelation UserAgentRelation? @relation'),
    # User model: matrixAccount[] -> matrixAccounts[]
    (r'  matrixAccount\s+MatrixAccount\[\]', '  matrixAccounts MatrixAccount[]'),
    # Agent model: agent? (self-ref) -> parent?
    # Actually this should already be 'agent' from camelCase conversion
]

for pattern, replacement in replacements:
    old = re.findall(pattern, content)
    content = re.sub(pattern, replacement, content)
    if old:
        print(f'Fixed ({len(old)}): {old[0][:60]}...')

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'w') as f:
    f.write(content)

print('Targeted fix complete')
