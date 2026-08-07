import re

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# 1. Add @default(uuid()) to id String @id without existing @default
content = re.sub(r'(  id\s+String\s+@id)(?!.*@default)', r'\1 @default(uuid())', content)

# 2. Add @updatedAt to updatedAt DateTime without existing @updatedAt  
content = re.sub(r'(  updatedAt\s+DateTime)(?!.*@updatedAt)', r'\1 @updatedAt', content)

# 3. Fix PascalCase single relation names to lowercase
model_names = [
    'User', 'Agent', 'Product', 'Order', 'Template', 'Token', 'QrCode', 
    'Plan', 'Log', 'Config', 'Rule', 'Record', 'Item', 'Lead', 'Account', 
    'Switch', 'Bot', 'Conversation', 'Message', 'Sync', 'Code', 'Effect', 
    'Session', 'Channel', 'Room', 'Human', 'Content', 'Key', 'Provider', 
    'App', 'Setting', 'AuditLog', 'AuditRule', 'Prompt', 
    'Notification', 'Feedback', 'Workflow', 'Step', 'Job', 'Event', 
    'Slot', 'Node', 'Element', 'Module', 'Plugin', 'Extension', 'Feature',
    'Interview', 'Resume',  'Relation', 'Unit',
    'ExecutionLog', 'Schedule', 'Batch'
]

for name in model_names:
    pat = '  ' + name + ' ' + name + ' @relation'
    rep = '  ' + name[0].lower() + name[1:] + ' ' + name + ' @relation'
    content = content.replace(pat, rep)

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'w') as f:
    f.write(content)

print('Schema fixed successfully')
