import paramiko
import sys
import json
import time
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

def sudo(cmd):
    stdin, stdout, stderr = ssh.exec_command(f"sudo bash -c '{cmd}'")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

# Step 1: Sync the fixed index.ts to server
print("Step 1: Upload fixed index.ts")
sftp = ssh.open_sftp()
sftp.put('server/src/index.ts', '/www/zhishuai/server/src/index.ts')
sftp.close()
print("Uploaded index.ts")

# Step 2: Rebuild
print("\nStep 2: Rebuild server")
out, err = run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -5")
print(f"Build: {out or err}")

# Step 3: Restart
print("\nStep 3: Restart API")
out, err = run("pm2 restart zhishuai-api 2>&1 | tail -3")
print(f"Restart: {out or err}")
time.sleep(5)

# Step 4: Test AI Chat
print("\nStep 4: Test AI Chat")

# Login
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
try:
    token_data = json.loads(out)
    token = token_data['data']['token']
    print(f"Login: OK (role={token_data['data']['user']['role']})")
except Exception as e:
    print(f"Login failed: {out[:300]}")
    ssh.close()
    sys.exit(1)

# Test AI Chat
out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好测试"}}],"modelKey":"qwen-turbo"}}'""")
print(f"AI Chat: {out[:500]}")

# Step 5: Test external HTTPS
print("\nStep 5: External HTTPS test")
tests = [
    ("Web (https)", "curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/"),
    ("API main domain", "curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/api/health"),
    ("API subdomain (HTTPS)", "curl -sk -o /dev/null -w '%{http_code}' https://api.baizhiji.net/health"),
    ("API subdomain (HTTP)", "curl -s -o /dev/null -w '%{http_code}' -L http://api.baizhiji.net/health"),
]
for name, cmd in tests:
    out, _ = run(cmd)
    print(f"  {name}: HTTP {out.strip()}")

ssh.close()
print("\nDone!")
