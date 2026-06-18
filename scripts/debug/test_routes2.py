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

# Login and get token
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''
print(f'\nToken: {token[:30]}...')

# Test key routes that should work
# 1. AI Config keys - GET user's API keys
run(f'curl -s "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}"')

# 2. Create an API key for the user (this is the critical feature!)
run(f'curl -s -X POST "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"provider":"dashscope","apiKey":"sk-test-dashscope-key-12345","name":"My DashScope Key"}}\'')

# 3. Verify the key was saved
run(f'curl -s "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}"')

# 4. Test AI chat message endpoint (this is the actual chat feature)
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/message" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"message":"Hello, this is a test","provider":"aliyun"}}\'')

# 5. Test ai-chat conversations list
run(f'curl -s "http://localhost:3001/api/ai-chat/conversations" -H "Authorization: Bearer {token}"')

# 6. Test admin api-providers (admin route, different base path)
run(f'curl -s "http://localhost:3001/api/admin/api-providers" -H "Authorization: Bearer {token}"')

# 7. Check route definitions properly
run('grep -E "router\\.(get|post|put|delete|patch)" /www/zhishuai/server/src/routes/ai-chat.ts')
run('grep -E "router\\.(get|post|put|delete|patch)" /www/zhishuai/server/src/routes/admin-api-providers.ts')

# 8. Check ai-chat route paths more specifically  
run('grep "router\\." /www/zhishuai/server/src/routes/ai-chat.ts | head -20')

c.close()
print('\n=== DONE ===')
