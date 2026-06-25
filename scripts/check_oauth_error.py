import paramiko, sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# 1. Check PM2 logs for recent oauth errors
print("=== PM2 API Logs (last 50 lines) ===")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --lines 50 --nostream 2>&1', timeout=30)
logs = stdout.read().decode('utf-8', errors='replace')
# Filter for oauth-related lines
for line in logs.split('\n'):
    if any(kw in line.lower() for kw in ['oauth', 'session', 'qrcode', 'browser', 'error', 'fail', 'reject', 'timeout', 'auth']):
        print(line)

# 2. Check error logs specifically
print("\n=== Error Logs (last 30 lines) ===")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --err --lines 30 --nostream 2>&1', timeout=30)
err_logs = stdout.read().decode('utf-8', errors='replace')
print(err_logs[:3000])

# 3. Try creating an oauth session directly and see what happens
print("\n=== Test: Create OAuth Session via curl ===")
stdin, stdout, stderr = ssh.exec_command('curl -s -X POST http://localhost:3001/api/oauth/sessions -H "Content-Type: application/json" -d \'{"platform":"douyin"}\' 2>&1', timeout=60)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:2000])

# 4. Check if browser/auth service has chromium installed
print("\n=== Check Chromium/Playwright ===")
stdin, stdout, stderr = ssh.exec_command('which chromium-browser || which chromium || which google-chrome || npx playwright --version 2>&1', timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# 5. Check browser-auth.service.ts deployed version
print("\n=== Check Deployed browser-auth.service.js key sections ===")
stdin, stdout, stderr = ssh.exec_command('head -100 /var/www/zhishuai/server/dist/services/browser-auth.service.js', timeout=10)
print(stdout.read().decode('utf-8', errors='replace')[:2000])

# 6. Check the oauth route handler
print("\n=== Check Deployed oauth.js route ===")
stdin, stdout, stderr = ssh.exec_command('cat /var/www/zhishuai/server/dist/routes/oauth.js | head -200', timeout=10)
print(stdout.read().decode('utf-8', errors='replace')[:3000])

ssh.close()
print("\nDONE")
