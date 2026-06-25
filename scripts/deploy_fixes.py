# -*- coding: utf-8 -*-
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASS = 'Hao20061218'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    return out, err

# Step 1: Upload fix script to server
print("Step 1: Uploading fix script...")
fix_script_content = '''# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

fpath = "/var/www/zhishuai/web/app/customer/layout/Navbar.tsx"
with open(fpath, "r") as f:
    content = f.read()

old_block = """        {
          key: 'code-assistant',
          label: '\\u7f16\\u7a0b\\u52a9\\u624b',
          icon: <CodeOutlined />,
          path: '/customer/code-assistant',
        },
        {
          key: 'acquisition','""

new_block = """        {
          key: 'acquisition','""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(fpath, "w") as f:
        f.write(content)
    print("OK - Removed code-assistant from Navbar")
elif "code-assistant" not in content:
    print("OK - Already removed")
else:
    print("WARN - Pattern mismatch")
'''

sftp = client.open_sftp()
with sftp.open('/tmp/fix_navbar.py', 'w') as f:
    f.write(fix_script_content)
sftp.close()

out, err = run('python3 /tmp/fix_navbar.py 2>&1')
print(out or err)

# Step 2: Rebuild frontend
print("\nStep 2: Rebuilding frontend (this may take 1-2 min)...")
out, err = run('cd /var/www/zhishuai/web && npm run build 2>&1 | tail -25', timeout=300)
# Show last lines
for line in (out or '').split('\n')[-15:]:
    print(line)
if err:
    for line in err.split('\n')[-5:]:
        print("ERR:", line)

# Step 3: Restart services
print("\nStep 3: Restarting services...")
out, err = run('pm2 restart zhishuai-api zhishuai-web 2>&1', timeout=30)
print(out or err)

import time
time.sleep(5)

# Step 4: Verify
print("\nStep 4: Verifying services...")
out, err = run('pm2 list --no-color 2>&1')
for line in out.split('\n'):
    if 'zhishuai' in line.lower() or 'name' in line.lower() or 'status' in line.lower():
        print(line)

# Step 5: Quick health check
print("\nStep 5: Health check...")
out, err = run('curl -s -o /dev/null -w "Web:%{http_code}" http://localhost:3000; echo ""; curl -s -o /dev/null -w "API:%{http_code}" http://localhost:4000/api/health 2>/dev/null; echo ""')
print(out or err)

print("\n=== ALL DONE ===")
client.close()
