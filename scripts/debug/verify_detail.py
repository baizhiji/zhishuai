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

# Login and get token
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''
print(f'\nToken: {token[:30]}...')

# Test admin endpoint - use -v to see full response
run(f'curl -v "http://localhost:3001/api/admin/api-providers" -H "Authorization: Bearer {token}" 2>&1 | head -30')

# Test ai-config routes - check what routes are registered
run(f'curl -v "http://localhost:3001/api/ai-config/providers" -H "Authorization: Bearer {token}" 2>&1 | head -30')

# Test user-keys with different path patterns
run(f'curl -s "http://localhost:3001/api/ai-config/my-keys" -H "Authorization: Bearer {token}"')
run(f'curl -s "http://localhost:3001/api/ai-config/keys" -H "Authorization: Bearer {token}"')

# Test ai-chat conversation creation with verbose
run(f'curl -v -X POST "http://localhost:3001/api/ai-chat/conversations" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"title":"Test"}}\' 2>&1 | head -30')

# Check the actual route definitions in ai-config.ts on server
run('head -30 /www/zhishuai/server/src/routes/ai-config.ts')

# Check the auth middleware to see how userId is extracted
run('head -30 /www/zhishuai/server/src/middleware/auth.ts')

# Check what routes ai-config.routes.ts defines (if it exists)
run('cat /www/zhishuai/server/src/routes/ai-config.routes.ts 2>&1 | head -20')

# Check error log (with UTF-8 properly)
run('cd /www/zhishuai/server && pm2 logs zhishuai-api --lines 5 --nostream 2>&1')

c.close()
print('\n=== DONE ===')
