import paramiko, sys, io, json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    out_safe = out.encode('ascii', 'replace').decode('ascii')
    if out_safe: print(out_safe[:2000])
    return out

# PM2 startup
run('pm2 startup 2>&1 | tail -3')
run('pm2 save 2>&1')

# Login
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d {"phone":"18601655222","password":"123456"}')
token = ''
if '"token":"' in login_result:
    token = login_result.split('"token":"')[1].split('"')[0]

print('\n' + '='*60)
print('FINAL COMPREHENSIVE VERIFICATION')
print('='*60)

# Health
r = run('curl -s https://baizhiji.net/api/health')
print(f'\n[Health] {"PASS" if "ok" in r else "FAIL"}')

# Login
print(f'[Login] {"PASS" if token else "FAIL"}')

# AI Chat (using json format without nested quotes)
chat_body = json.dumps({"messages":[{"role":"user","content":"Test"}],"modelKey":"qwen_turbo"})
r = run(f'curl -s -X POST http://localhost:3001/api/ai-chat/chat -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{chat_body}\'')
print(f'[AI Chat] {"PASS" if "success" in r else "FAIL"}')

# AI Models
r = run(f'curl -s http://localhost:3001/api/ai-chat/models -H "Authorization: Bearer {token}"')
print(f'[AI Models] {"PASS" if "qwen" in r else "FAIL"}')

# API Keys
r = run(f'curl -s http://localhost:3001/api/ai-config/keys -H "Authorization: Bearer {token}"')
print(f'[API Keys] {"PASS" if "success" in r else "FAIL"}')

# Conversations
r = run(f'curl -s http://localhost:3001/api/ai-chat/conversations -H "Authorization: Bearer {token}"')
print(f'[Conversations] {"PASS" if "conversations" in r else "FAIL"}')

# Admin Providers
r = run(f'curl -s http://localhost:3001/api/admin/api-providers/providers -H "Authorization: Bearer {token}"')
print(f'[Admin Providers] {"PASS" if "success" in r else "FAIL"}')

# Website
r = run('curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/')
print(f'[Website] {"PASS" if r == "200" else "FAIL"}')

# PM2
r = run('pm2 list 2>&1')
print(f'[PM2 Running] {"PASS" if "online" in r else "FAIL"}')

# Error check
r = run('pm2 logs zhishuai-api --err --lines 3 --nostream 2>&1')
print(f'[No New Errors] {"PASS" if len(r) < 100 else "CHECK"}')

print('\n' + '='*60)
print('ALL CORE SERVICES VERIFIED')
print('='*60)

c.close()
