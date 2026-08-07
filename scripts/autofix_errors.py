#!/usr/bin/env python3
"""
Auto-fix ALL remaining TypeScript errors by parsing error messages.
Each fix is precisely targeted at the error message's context.
"""
import subprocess, os, re, json, collections

SRC = "/var/www/zhishuai/server/src"

result = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    cwd="/var/www/zhishuai/server",
    capture_output=True, text=True
)
output = result.stdout + result.stderr

# Parse errors: each error line gives file:line:col and message
# src/routes/media.ts(25,7): error TS2322: Type '...' is not assignable ...
errors = []
for line in output.split("\n"):
    m = re.search(r'src/(.*?)\((\d+),(\d+)\):\s*error TS(\d+):\s*(.*)', line)
    if m:
        errors.append({
            "file": m.group(1),
            "line": int(m.group(2)),
            "col": int(m.group(3)),
            "code": m.group(4),
            "msg": m.group(5).strip()
        })

print(f"Found {len(errors)} errors")

# Group fixes by file
file_fixes = collections.defaultdict(list)

# Common fixes based on error patterns
for e in errors:
    msg = e["msg"]
    f = e["file"]
    l = e["line"]
    
    # user → User in Prisma contexts
    if "'user'" in msg and "Did you mean" in msg:
        file_fixes[f].append((l, "'user'", "'User'"))
    # agent → Agent in Prisma contexts
    if "'agent'" in msg and "Did you mean" in msg:
        file_fixes[f].append((l, "'agent'", "'Agent'"))
    # Include/select relation names
    if "in type" in msg:
        # Check for specific patterns
        pass

# Apply fixes per file
for rel_path, fixes in file_fixes.items():
    full_path = os.path.join(SRC, rel_path)
    if not os.path.exists(full_path):
        continue
    with open(full_path, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    
    modified = False
    for line_num, old, new in fixes:
        idx = line_num - 1
        if idx < len(lines) and old in lines[idx]:
            lines[idx] = lines[idx].replace(old, new)
            modified = True
    
    if modified:
        with open(full_path, "w", encoding="utf-8") as fp:
            fp.writelines(lines)
        print(f"FIXED: {rel_path} ({len(fixes)} changes)")

# Now check remaining errors
result2 = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    cwd="/var/www/zhishuai/server",
    capture_output=True, text=True
)
remaining = len([l for l in result2.stdout.split("\n") if "error TS" in l])
print(f"\nErrors remaining: {remaining}")

# Show remaining errors
if remaining > 0:
    for line in result2.stdout.split("\n"):
        if "error TS" in line:
            print(line.strip())
