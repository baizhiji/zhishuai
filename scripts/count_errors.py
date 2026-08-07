#!/usr/bin/env python3
import subprocess, collections

result = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    cwd="/var/www/zhishuai/server",
    capture_output=True, text=True
)
lines = result.stdout.split("\n")
files = collections.Counter()
for line in lines:
    if "error TS" in line and "/src/" in line:
        # Extract file path
        parts = line.split("/src/", 1)
        if len(parts) > 1:
            path = parts[1].split("(")[0].strip()
            files[path] += 1

for path, count in files.most_common(30):
    print(f"  {count:3d}  {path}")
print(f"\nTotal errors: {sum(files.values())}")
