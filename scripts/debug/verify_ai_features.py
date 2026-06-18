import paramiko, sys, io, json

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

# Get fresh token
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = ''
if '"token":"' in login_result:
    token = login_result.split('"token":"')[1].split('"')[0]
    print(f'\n*** Token: {token[:20]}... ***')

# Test user features with userId query param
run(f'curl -s "http://localhost:3001/api/features?userId=73d8bf56-b531-411e-9f88-715e821ab3f5" -H "Authorization: Bearer {token}"')

# Test AI config providers (admin endpoint - need admin role)
run(f'curl -s "http://localhost:3001/api/admin/api-providers" -H "Authorization: Bearer {token}"')

# Test user API key endpoints  
run(f'curl -s "http://localhost:3001/api/ai-config/user-keys" -H "Authorization: Bearer {token}"')

# Test AI chat (should work with auth token)
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/conversations" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"title":"Test Chat"}}\'')

# Test AI enhanced endpoints (title generation)
run(f'curl -s -X POST "http://localhost:3001/api/ai-enhanced/title" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"content":"Test content for title"}}\'')

# Test register endpoint (password-based)
run('curl -s -X POST "http://localhost:3001/api/auth/register" -H "Content-Type: application/json" -d \'{"phone":"13900000001","password":"test123","name":"NewTestUser"}\'')

# Test website frontend
run('curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/')

# Check error log for any issues
run('pm2 logs zhishuai-api --err --lines 10 --nostream 2>&1')

c.close()
print('\n=== AI FEATURES VERIFICATION DONE ===')
