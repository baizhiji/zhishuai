import paramiko, time, sys, base64

sys.stdout.reconfigure(encoding='utf-8')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASS = 'Hao20061218'

def run(c, cmd, t=30):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, 22, USER, PASS, timeout=15)

print("=== Step 1: Upload fixed browser-auth.service.ts ===")

# Read local file
with open(r'c:\Users\Administrator\zhishuai\server\src\services\browser-auth.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Write to remote
encoded = base64.b64encode(content.encode('utf-8')).decode('ascii')
run(c, f"echo '{encoded}' | base64 -d > /var/www/zhishuai/server/src/services/browser-auth.service.ts")
print("  Uploaded browser-auth.service.ts")

# Read local page.tsx
with open(r'c:\Users\Administrator\zhishuai\web\app\customer\media\matrix\page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()

# Write to remote
page_encoded = base64.b64encode(page_content.encode('utf-8')).decode('ascii')
run(c, f"echo '{page_encoded}' | base64 -d > /var/www/zhishuai/web/app/customer/media/matrix/page.tsx")
print("  Uploaded matrix/page.tsx")

print("\n=== Step 2: Build server ===")
out = run(c, "cd /var/www/zhishuai/server && npx tsc --skipLibCheck 2>&1 | tail -20", t=120)
print(out[:500] if out else "(no output)")

print("\n=== Step 3: Build web ===")
out = run(c, "cd /var/www/zhishuai/web && npm run build 2>&1 | tail -30", t=300)
if 'error' in out.lower() and 'compiled' not in out.lower():
    print("BUILD ERROR:")
    print(out[-1000:] if len(out) > 1000 else out)
else:
    print("Web build OK (or already built)")

print("\n=== Step 4: Restart services ===")
run(c, "pm2 restart zhishuai-api zhishuai-web 2>&1")
time.sleep(5)
out = run(c, "pm2 list --no-color | grep zhishuai")
for line in out.split('\n'):
    if 'zhishuai' in line:
        print(f"  {line.strip()}")

print("\n=== Step 5: Verify site ===")
code = run(c, "curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net")
print(f"Site status: {code}")

print("\nDone!")
c.close()
