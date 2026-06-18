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
    if out_safe: print(out_safe[:1500])
    return out

# 1. Health check
run('curl -s http://localhost:3001/api/health')

# 2. Login test
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

# 3. Extract token and test auth-protected endpoint
if login_result and 'token' in login_result:
    # Extract token
    token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''
    if token:
        print(f'\n*** TOKEN extracted: {token[:20]}... ***')
        # Test AI config endpoint (auth protected)
        run(f'curl -s http://localhost:3001/api/ai-config/providers -H "Authorization: Bearer {token}"')
        # Test user features
        run(f'curl -s http://localhost:3001/api/features -H "Authorization: Bearer {token}"')
    else:
        print('\n*** No token found in login response ***')
        print(f'Login response: {login_result[:300]}')

# 4. Check PM2 status
run('pm2 list 2>&1')

# 5. Clear old error logs and verify no new errors
run('pm2 flush zhishuai-api 2>&1')
run('sleep 3')
run('curl -s http://localhost:3001/api/health')
run('pm2 logs zhishuai-api --err --lines 5 --nostream 2>&1')

# 6. Test external access via nginx
run('curl -s https://baizhiji.net/api/health')

# 7. Save PM2
run('pm2 save 2>&1')

c.close()
print('\n=== ALL VERIFICATION DONE ===')
