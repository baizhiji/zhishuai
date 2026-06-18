import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Get API error log
    'cat /home/ubuntu/.pm2/logs/zhishuai-api-error.log 2>/dev/null | tail -50',
    # Delete errored process and restart with explicit cwd
    'pm2 delete zhishuai-api 2>&1',
    # Check that PORT 3001 is not used by anything else
    'ss -tlnp | grep 3001 2>&1',
    # Start API with proper cwd and env vars
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api --cwd /www/zhishuai/server 2>&1',
    # Wait for startup
    'sleep 15 && pm2 list 2>&1',
    # Check health
    'curl -s http://localhost:3001/health',
    # Test login
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
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
