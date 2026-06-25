#!/usr/bin/env python3
"""Remote fix script - runs on the server"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Fix 1: account/page.tsx - fix JSX syntax error on icon line
print("[Fix1] account/page.tsx")
f1 = '/var/www/zhishuai/web/app/account/page.tsx'
with open(f1, 'r') as f:
    c1 = f.read()

# The problematic pattern: <s.iconType ... /> which JSX interprets as a tag
# Need to change to: s.iconType ... ? <Component /> : ...
old_pattern = "icon: <s.iconType === 'media' ? SafetyCertificateOutlined : s.iconType === 'recruit' ? CrownOutlined : s.iconType === 'acquisition' ? SafetyCertificateOutlined : TrophyOutlined />"
new_pattern = "icon: s.iconType === 'media' ? <SafetyCertificateOutlined /> : s.iconType === 'recruit' ? <CrownOutlined /> : s.iconType === 'acquisition' ? <SafetyCertificateOutlined /> : <TrophyOutlined />"

if old_pattern in c1:
    c1 = c1.replace(old_pattern, new_pattern)
    with open(f1, 'w') as f:
        f.write(c1)
    print("  FIXED!")
else:
    print("  Pattern not found. Current icon lines:")
    for i, line in enumerate(c1.split('\n'), 1):
        if 's.iconType' in line or 'icon:' in line and i > 38 and i < 45:
            print(f"    Line {i}: {line.strip()[:80]}")

# Fix 2: performance/page.tsx - remove orphaned mock data
print("\n[Fix2] performance/page.tsx")
f2 = '/var/www/zhishuai/web/app/admin/performance/page.tsx'
with open(f2, 'r') as f:
    lines = f.readlines()

orig_len = len(lines)
print(f"  Original: {orig_len} lines")

# Strategy: find the closing }; of fetchAgentPerformance (around line 85)
# Then remove the orphaned object data that follows until ]; on line 120
new_lines = []
i = 0
skipped = False
while i < len(lines):
    # Check for the pattern: line ending with "  };" followed by "      customers: 85,"
    line_stripped = lines[i].strip()
    if line_stripped == '};' and i + 1 < len(lines):
        next_stripped = lines[i + 1].strip()
        # If next line starts with orphaned data like "customers: 85,"
        if next_stripped.startswith('customers:') and '85' in next_stripped:
            new_lines.append(lines[i])  # keep the };
            # Skip forward until we find "];"
            i += 1
            while i < len(lines):
                if lines[i].strip() == '];':
                    skipped = True
                    i += 1  # skip ]; too
                    break
                i += 1
            continue
    new_lines.append(lines[i])
    i += 1

with open(f2, 'w') as f:
    f.writelines(new_lines)

print(f"  Fixed: {len(new_lines)} lines (removed {orig_len - len(new_lines)} lines)")

# Quick verification
with open(f2, 'r') as f:
    verify = f.readlines()
print(f"  Verification: {len(verify)} lines total")

# Check that }; followed by const showDetail (the expected pattern after fix)
content = ''.join(verify)
idx = content.find('};\n  const showDetail')
if idx >= 0:
    print("  Pattern OK: }; -> const showDetail (no orphaned data)")
else:
    print("  WARNING: Expected pattern not found after fix")

print("\n[DONE] Both files fixed!")
