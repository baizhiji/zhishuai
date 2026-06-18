import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Check PM2 status
    'pm2 list 2>&1',
    # Check if API is running
    'sleep 5 && curl -s http://localhost:3001/health',
    # Check PM2 logs for errors
    'pm2 logs zhishuai-api --lines 20 --nostream 2>&1',
    # Check if tsx is used instead of node (dist may not exist)
    'pm2 show zhishuai-api 2>&1 | head -30',
    # Test login
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"123456\"}"',
    # Test API key config endpoint
    'curl -s http://localhost:3001/api/ai-config/providers 2>&1',
    # Check website
    'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:800])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
