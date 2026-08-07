import re

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# 1. Add @default(uuid()) to id String @id without existing @default
content = re.sub(r'(  id\s+String\s+@id)(?!.*@default)', r'\1 @default(uuid())', content)

# 2. Add @updatedAt to updatedAt DateTime without existing @updatedAt  
content = re.sub(r'(  updatedAt\s+DateTime)(?!.*@updatedAt)', r'\1 @updatedAt', content)

# 3. Fix relation field names - use \s+ for flexible whitespace

# Single relations: "  PascalName TypeName? @relation(...)"
def fix_single_relation(match):
    indent = match.group(1)
    field = match.group(2)
    type_opt = match.group(3)
    relation = match.group(4)
    camel = field[0].lower() + field[1:]
    return f'{indent}{camel} {type_opt} {relation}'

content = re.sub(
    r'^(\s+)([A-Z][a-zA-Z]+)\s+([A-Z][a-zA-Z]+\??)\s+(@relation\([^)]+\))$',
    fix_single_relation,
    content,
    flags=re.MULTILINE
)

# Array relations: "  PascalName TypeName[]"
def fix_array_relation(match):
    indent = match.group(1)
    field = match.group(2)
    type_name = match.group(3)
    rest = match.group(4) or ''
    camel = field[0].lower() + field[1:]
    return f'{indent}{camel} {type_name}[]{rest}'

content = re.sub(
    r'^(\s+)([A-Z][a-zA-Z]+)\s+([A-Z][a-zA-Z]+)\[\](\s*)$',
    fix_array_relation,
    content,
    flags=re.MULTILINE
)

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'w') as f:
    f.write(content)

print('Schema v4 fixed successfully')
