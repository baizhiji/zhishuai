# -*- coding: utf-8 -*-
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def r(cmd, t=15):
    _, out, err = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# 1. Site status
print("1. Site: https://baizhiji.net =", r('curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net'))

# 2. PM2 status
print("\n2. PM2:")
out = r('pm2 list --no-color')
for line in out.split('\n'):
    if 'zhishuai' in line.lower() or 'name' in line.lower() or 'status' in line.lower():
        print("   ", line.strip())

# 3. Code-assistant removed?
content = r('cat /var/www/zhishuai/web/app/customer/layout/Navbar.tsx')
print(f"\n3. code-assistant in Navbar.tsx: {'YES (still there!)' if 'code-assistant' in content else 'NO (removed)'}")

# 4. Playwright browsers
print("\n4. Playwright browsers installed:")
print("   ", r('ls /home/ubuntu/.cache/ms-playwright/ 2>/dev/null'))

# 5. Test OAuth API now that Chromium is installed
print("\n5. Testing OAuth endpoint with Playwright browser...")
cmd = "curl -s -X POST http://localhost:4000/api/oauth/sessions -H 'Content-Type: application/json' -H 'Authorization: Bearer test' -d '{\"platform\":\"douyin\"}' > /dev/null 2>&1"
r(cmd)
time.sleep(10)  # Wait for playwright to launch browser

log = r('pm2 logs zhishuai-api --lines 20 --nostream 2>&1 | grep -iE "auth|error|fail|browser|qrcode|session|chromium|launch|success|创建|二维码" | tail -8')
if log:
    for l in log.split('\n'):
        print("   ", l)
else:
    print("   (checking recent logs)")
    print("   ", r('pm2 logs zhishuai-api --lines 5 --nostream 2>&1 | tail -3'))

c.close()
print("\n=== DONE ===")
