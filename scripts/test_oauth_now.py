# -*- coding: utf-8 -*-
import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def r(cmd, t=60):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# First get a valid token by logging in
print("Getting auth token...")
token_res = r('''curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"phone":"13800138000","password":"test123456"}' ''')
print("Login response:", token_res[:200] if token_res else "(empty)")

# Extract token
import json
try:
    td = json.loads(token_res)
    token = td.get('data', {}).get('token') or td.get('token') or ''
    print(f"Token: {token[:30]}..." if len(token) > 30 else f"Token: {token or 'NOT FOUND'}")
except:
    token = ''

if not token:
    # Try to find any user and create a test session another way
    print("Could not get token, checking API logs for latest request...")
    # Just trigger a new request and check the result
    r("curl -s -X POST http://localhost:4000/api/oauth/sessions -H 'Content-Type: application/json' -H 'Authorization: Bearer dummy-token-for-test' -d '{\"platform\":\"douyin\"}' > /dev/null 2>&1")

print("\nWaiting 20s for browser to launch and process...")
time.sleep(20)

print("\n=== LATEST OAuth Logs (after playwright install) ===")
log = r('pm2 logs zhishuai-api --lines 40 --nostream 2>&1 | grep -iE "auth|oauth|playwright|browser|error|fail|chromium|创建|qrcode|launch|success" | tail -12')
for line in log.split('\n'):
    print(" ", line)

c.close()
