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

# Login
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''
print(f'\nToken: {token[:30]}...')

# Test correct route paths
# 1. Admin providers list (correct path: /providers)
run(f'curl -s "http://localhost:3001/api/admin/api-providers/providers" -H "Authorization: Bearer {token}"')

# 2. Available providers
run(f'curl -s "http://localhost:3001/api/admin/api-providers/available" -H "Authorization: Bearer {token}"')

# 3. AI Chat models list
run(f'curl -s "http://localhost:3001/api/ai-chat/models" -H "Authorization: Bearer {token}"')

# 4. Create an API Key with full params
run(f'curl -s -X POST "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"provider":"dashscope","apiKey":"sk-test-dashscope-key","secretKey":"test-secret","name":"My DashScope Key","isPrimary":true}}\'')

# 5. Check keys again
run(f'curl -s "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}"')

# 6. Test AI Chat - send a message (POST /chat)
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"message":"Hello","provider":"aliyun","model":"qwen-max"}}\'')

# 7. Test the external website
run('curl -s -o /dev/null -w "HTTP %{http_code}" https://baizhiji.net/')

# 8. Test external API health
run('curl -s https://baizhiji.net/api/health')

# 9. Clean up test user (delete the test registration)
run('curl -s -X DELETE "http://localhost:3001/api/auth/user/13900000001" -H "Authorization: Bearer {token}"')

# Save PM2
run('pm2 save 2>&1')

c.close()
print('\n=== FULL ROUTE TESTING DONE ===')
