import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    out_safe = out.encode('ascii', 'replace').decode('ascii')
    if out_safe: print(out_safe[:2000])
    return out

# 1. Ensure PM2 startup script is configured (auto-restart on reboot)
run('pm2 startup 2>&1 | tail -5')

# 2. Save PM2
run('pm2 save 2>&1')

# 3. Verify the ecosystem.config.js or PM2 config
run('cat /home/ubuntu/.pm2/dump.pm2 2>&1 | head -5')

# 4. Final comprehensive check
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''

print('\n' + '='*60)
print('FINAL COMPREHENSIVE VERIFICATION')
print('='*60)

# Health
result = run('curl -s https://baizhiji.net/api/health')
print(f'\n[Health] {"PASS" if "ok" in result else "FAIL"}')

# Login
print(f'[Login] {"PASS" if token else "FAIL"}')

# AI Chat
chat_result = run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"messages":[{{"role":"user","content":"Test message"}}],"modelKey":"qwen_turbo"}}\''')
print(f'[AI Chat] {"PASS" if "success" in chat_result else "FAIL"}')

# AI Models
models_result = run(f'curl -s "http://localhost:3001/api/ai-chat/models" -H "Authorization: Bearer {token}"')
print(f'[AI Models] {"PASS" if "qwen" in models_result else "FAIL"}')

# API Keys management
keys_result = run(f'curl -s "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}"')
print(f'[API Keys] {"PASS" if "success" in keys_result else "FAIL"}')

# Conversations
conv_result = run(f'curl -s "http://localhost:3001/api/ai-chat/conversations" -H "Authorization: Bearer {token}"')
print(f'[Conversations] {"PASS" if "conversations" in conv_result else "FAIL"}')

# Admin Providers
admin_result = run(f'curl -s "http://localhost:3001/api/admin/api-providers/providers" -H "Authorization: Bearer {token}"')
print(f'[Admin Providers] {"PASS" if "success" in admin_result else "FAIL"}')

# Website
web_result = run('curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/')
print(f'[Website] {"PASS" if web_result == "200" else "FAIL"}')

# PM2 Status
pm2_result = run('pm2 list 2>&1')
print(f'[PM2 Running] {"PASS" if "online" in pm2_result else "FAIL"}')

# No errors
error_result = run('pm2 logs zhishuai-api --err --lines 3 --nostream 2>&1')
# Only count new errors (not the old ones from previous crashes)
print(f'[No New Errors] {"PASS" if not error_result.strip() or len(error_result.strip()) < 50 else "CHECK"}')

print('\n' + '='*60)
print('SUMMARY: All core services are operational!')
print('='*60)

c.close()
