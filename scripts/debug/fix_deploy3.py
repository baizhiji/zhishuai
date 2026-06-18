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

# Step 1: First test if the new TokenHub URL works from the server
print("Step 1: Test TokenHub API connectivity")
out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://tokenhub.tencentmaas.com/ 2>&1")
print(f"tokenhub.tencentmaas.com: HTTP {out}")

out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://tokenhub.tencentmaas.com/v1/models 2>&1")
print(f"tokenhub.tencentmaas.com/v1/models: HTTP {out}")

# Step 2: Upload all changed files
print("\nStep 2: Upload changed files")
sftp = ssh.open_sftp()

files_to_upload = [
    ('server/src/routes/ai-chat.ts', '/www/zhishuai/server/src/routes/ai-chat.ts'),
    ('server/src/routes/code-assistant.ts', '/www/zhishuai/server/src/routes/code-assistant.ts'),
    ('server/src/services/ai-model-router.ts', '/www/zhishuai/server/src/services/ai-model-router.ts'),
    ('server/src/services/user-api-key.service.ts', '/www/zhishuai/server/src/services/user-api-key.service.ts'),
    ('server/src/services/ai-models.ts', '/www/zhishuai/server/src/services/ai-models.ts'),
    ('server/src/index.ts', '/www/zhishuai/server/src/index.ts'),
]

for local, remote in files_to_upload:
    try:
        sftp.put(local, remote)
        print(f"  Uploaded: {local}")
    except Exception as e:
        print(f"  Failed: {local} - {e}")

sftp.close()

# Step 3: Rebuild
print("\nStep 3: Rebuild")
out, err = run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -5")
print(f"Build: {out or err}")

# Step 4: Restart
print("\nStep 4: Restart")
run("pm2 restart zhishuai-api 2>&1 | tail -3")
time.sleep(5)

# Step 5: Test AI Chat - first with Tencent (primary)
print("\nStep 5: Test AI Chat")

# Login
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
try:
    token_data = json.loads(out)
    token = token_data['data']['token']
    print(f"Login: OK")
except:
    print(f"Login failed: {out[:300]}")
    ssh.close()
    sys.exit(1)

# Test auto model selection (should pick Tencent first)
out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好测试"}}]}}'""")
print(f"AI Chat (auto - should use Tencent): {out[:600]}")

# Test with explicit Tencent model
out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好"}}],"modelKey":"hunyuan_instruct"}}'""")
print(f"AI Chat (hunyuan_instruct - Tencent): {out[:600]}")

# Test with explicit Aliyun model
out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好"}}],"modelKey":"qwen-turbo"}}'""")
print(f"AI Chat (qwen-turbo - Aliyun): {out[:600]}")

# Test model list
out, _ = run(f"""curl -s -H 'Authorization: Bearer {token}' http://localhost:3001/api/ai-chat/models""")
try:
    models_data = json.loads(out)
    if models_data.get('success'):
        models = models_data['data']
        print(f"\nAvailable models: {len(models)} total")
        for m in models[:5]:
            print(f"  {m['key']}: {m['name']} ({m['provider']})")
        if len(models) > 5:
            print(f"  ... and {len(models)-5} more")
except:
    print(f"Models list: {out[:300]}")

ssh.close()
print("\nDone!")
