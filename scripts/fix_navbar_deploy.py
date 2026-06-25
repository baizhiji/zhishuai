# -*- coding: utf-8 -*-
import paramiko
import sys
import base64
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASS = 'Hao20061218'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    return out, err

# Write fix script as base64 to avoid shell escaping issues
print("Step 1: Fixing Navbar.tsx...")

fix_script = r"""# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
fpath = '/var/www/zhishuai/web/app/customer/layout/Navbar.tsx'
with open(fpath, 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
skip_count = 0
while i < len(lines):
    line = lines[i]
    # Detect the code-assistant block start
    if "key: 'code-assistant'" in line and i + 5 < len(lines):
        # Skip this block (7 lines including the blank line before next item)
        # Skip until we find the next { key: block
        skip_count += 1
        i += 1
        while i < len(lines):
            if "key: 'acquisition'" in lines[i]:
                break
            i += 1
        # Don't add the acquisition line here, let normal flow handle it
        continue
    new_lines.append(line)
    i += 1

with open(fpath, 'w') as f:
    f.writelines(new_lines)

# Verify
with open(fpath, 'r') as f:
    content = f.read()
if 'code-assistant' not in content:
    print('OK - code-assistant removed successfully')
else:
    print('WARN - code-assistant still present')
"""

b64 = base64.b64encode(fix_script.encode('utf-8')).decode('ascii')
out, err = run(f'echo "{b64}" | base64 -d > /tmp/fix_nav.py && python3 /tmp/fix_nav.py 2>&1')
print(out or err)

# Step 2: Rebuild
print("\nStep 2: Rebuilding...")
out, err = run('cd /var/www/zhishuai/web && npm run build 2>&1 | tail -6', timeout=300)
for line in (out or '').split('\n')[-6:]:
    print(line)

# Step 3: Restart web
run('pm2 restart zhishuai-web 2>&1')

import time
time.sleep(6)

# Step 4: Check
print("\nStep 3: Verify...")
out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net")
print(f"Site status: {out.strip()}")

# Also check that code-assistant is gone from the built file
out, _ = run("grep -c 'code-assistant' /var/www/zhishuai/web/.next/server/app/customer/layout/Navbar.js 2>/dev/null || echo '0'")
print(f"References to code-assistant in build: {out.strip()}")

print("\n=== DONE ===")
client.close()
