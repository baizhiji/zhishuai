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

# Step 1: Check if the server can reach external AI APIs
print("Step 1: Test external API connectivity")
out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://dashscope.aliyuncs.com/ 2>&1")
print(f"Aliyun DashScope: HTTP {out}")

out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://tokenhub.cloud.tencent.com/ 2>&1")
print(f"Tencent TokenHub: HTTP {out}")

# Step 2: Test AI API directly with the key from .env
print("\nStep 2: Test AI API directly")
out, _ = run("grep DASHSCOPE_API_KEY /www/zhishuai/server/.env | head -1")
dashscope_key = out.split('=', 1)[1].strip().strip('"').strip("'") if '=' in out else ''
print(f"DashScope key present: {bool(dashscope_key)} (len={len(dashscope_key)})")

if dashscope_key:
    # Try a minimal API call
    out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer {dashscope_key}' \
      -d '{{"model":"qwen-turbo","messages":[{{"role":"user","content":"hi"}}],"max_tokens":10}}' 2>&1""")
    print(f"Direct API call result: {out[:500]}")

# Step 3: Check pm2 error logs
print("\nStep 3: PM2 error logs")
out, _ = run("pm2 logs zhishuai-api --nostream --lines 10 --err 2>&1")
print(out[:1000])

# Step 4: Debug the 404 on api.baizhiji.net
print("\nStep 4: Debug api.baizhiji.net 404")

# Check nginx config is loaded
out, _ = sudo("nginx -T 2>&1 | grep -A5 'server_name api.baizhiji.net'")
print(f"Nginx config for api.baizhiji.net:\n{out[:500]}")

# Check what port 443 is doing
out, _ = run("curl -svk https://api.baizhiji.net/health 2>&1 | head -20")
print(f"Verbose HTTPS test:\n{out[:500]}")

# Check if health endpoint works on localhost
out, _ = run("curl -s http://localhost:3001/health 2>&1")
print(f"Localhost /health: {out[:200]}")

out, _ = run("curl -s http://localhost:3001/api/health 2>&1")
print(f"Localhost /api/health: {out[:200]}")

# Step 5: Check the request body format
print("\nStep 5: Test with proper messages format")
# Login first
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
try:
    token_data = json.loads(out)
    token = token_data['data']['token']
    print(f"Login OK")
except:
    print(f"Login failed: {out[:200]}")
    ssh.close()
    sys.exit(1)

# Test with messages array format
out, _ = run(f"""curl -s -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"say hello"}}],"modelKey":"qwen-turbo"}}' 2>&1""")
print(f"AI Chat result: {out[:800]}")

ssh.close()
print("\nDone!")
