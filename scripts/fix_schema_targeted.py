"""Targeted schema fix: rename relation fields to match original code naming."""
import re

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# These are the specific field renames needed to match code expectations.
# Format: (model_pattern, old_field_name, new_field_name, is_array)
# We use regex that matches "fieldName ModelType" or "fieldName ModelType[]"

replacements = [
    # AcquisitionTask model -> leads (was acquisitionLead[])
    (r'  acquisitionLead AcquisitionLead\[\]', '  leads AcquisitionLead[]'),
    # AcquisitionLead model -> followups (was leadFollowup[])
    (r'  leadFollowup LeadFollowup\[\]', '  followups LeadFollowup[]'),
    # AcquisitionLead model -> task (single relation, was acquisitionTask)
    (r'  acquisitionTask AcquisitionTask\? @relation', '  task AcquisitionTask? @relation'),
    # Agent model -> agentRelations (was userAgentRelation[])
    (r'  userAgentRelation UserAgentRelation\[\]', '  agentRelations UserAgentRelation[]'),
    # Agent model -> User (was User, kept capitalized - need to check)
    # Agent model -> User (in include, need user lowercase)
    (r'  User User @relation', '  user User @relation'),
    # Agent model -> Agent (parent agent reference)
    (r'  Agent Agent @relation', '  agent Agent @relation'),
    # User model -> agentRelation (single, was userAgentRelation?)
    (r'  userAgentRelation UserAgentRelation\? @relation', '  agentRelation UserAgentRelation? @relation'),
    # User model -> matrixAccounts (was matrixAccount[])
    (r'  matrixAccount MatrixAccount\[\]', '  matrixAccounts MatrixAccount[]'),
    # PublishRecord model -> socialAccount (check if it's socialAccount or SocialAccount)
    (r'  SocialAccount SocialAccount @relation', '  socialAccount SocialAccount @relation'),
]

for pattern, replacement in replacements:
    count = len(re.findall(pattern, content))
    content = re.sub(pattern, replacement, content)
    if count > 0:
        print(f'Fixed: {pattern[:50]}... ({count} occurrences)')

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'w') as f:
    f.write(content)

print('Targeted schema fix complete')
