import re

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Fix 1: Single relations - "  PascalName PascalName @relation" -> "  camelName PascalName @relation"
# Handle optional marker (?) too
def fix_relation_field(match):
    indent = match.group(1)
    field_name = match.group(2)  # PascalCase
    optional = match.group(3) or ''  # ? or empty
    type_name = match.group(4)
    rest = match.group(5)
    camel = field_name[0].lower() + field_name[1:]
    return f'{indent}{camel} {type_name}{optional} @relation{rest}'

content = re.sub(
    r'^(\s+)([A-Z][a-zA-Z]+) ([A-Z][a-zA-Z]+)(\??) @relation(.+)$',
    fix_relation_field,
    content,
    flags=re.MULTILINE
)

# Fix 2: Array relations - "  PascalName PascalName[]" -> "  camelName PascalName[]"
def fix_array_relation(match):
    indent = match.group(1)
    field_name = match.group(2)
    type_name = match.group(3)
    camel = field_name[0].lower() + field_name[1:]
    return f'{indent}{camel} {type_name}[]'

content = re.sub(
    r'^(\s+)([A-Z][a-zA-Z]+) ([A-Z][a-zA-Z]+)\[\]$',
    fix_array_relation,
    content,
    flags=re.MULTILINE
)

# Fix 3: Optional array relations - "  PascalName PascalName?[]"
# (unlikely but handle)
def fix_opt_array(match):
    indent = match.group(1)
    field_name = match.group(2)
    type_name = match.group(3)
    camel = field_name[0].lower() + field_name[1:]
    return f'{indent}{camel} {type_name}[]'

content = re.sub(
    r'^(\s+)([A-Z][a-zA-Z]+) ([A-Z][a-zA-Z]+)\?\[\]$',
    fix_opt_array,
    content,
    flags=re.MULTILINE
)

with open('/var/www/zhishuai/server/prisma/schema.prisma', 'w') as f:
    f.write(content)

print('Schema fixed with regex-based relation renaming')
