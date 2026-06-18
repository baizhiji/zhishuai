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

# Upload & rebuild
sftp = ssh.open_sftp()
sftp.put('server/src/routes/ai-chat.ts', '/www/zhishuai/server/src/routes/ai-chat.ts')
sftp.close()
print("Uploaded ai-chat.ts")

out, err = run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -3")
print(f"Build: {out or err}")

run("pm2 restart zhishuai-api 2>&1 | tail -3")
time.sleep(5)

# Test
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
try:
    token = json.loads(out)['data']['token']
    print("Login: OK")
except:
    print(f"Login failed: {out[:200]}")
    ssh.close()
    sys.exit(1)

# Test qwen-turbo (with hyphen, should normalize to qwen_turbo and use aliyun)
out, _ = run(f"""curl -s -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好"}}],"modelKey":"qwen-turbo"}}'""")
print(f"qwen-turbo: {out[:400]}")

# Test auto (should pick tencent hunyuan)
out, _ = run(f"""curl -s -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好"}}]}}'""")
print(f"auto: {out[:400]}")

# Test hunyuan explicitly
out, _ = run(f"""curl -s -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"你好"}}],"modelKey":"hunyuan_instruct"}}'""")
print(f"hunyuan_instruct: {out[:400]}")

# Test deepseek r1
out, _ = run(f"""curl -s -X POST http://localhost:3001/api/ai-chat/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{{"messages":[{{"role":"user","content":"1+1等于多少"}}],"modelKey":"deepseek_r1"}}'""")
print(f"deepseek_r1: {out[:400]}")

ssh.close()
print("\nDone!")
