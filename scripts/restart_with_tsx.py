import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Stop old errored processes
    'pm2 delete zhishuai-api 2>&1 || echo already-deleted',
    'pm2 delete zhishuai-web 2>&1 || echo already-deleted',
    
    # Install tsx in server directory
    'cd /www/zhishuai/server && npm install tsx 2>&1 | tail -5',
    
    # Start API with tsx (direct TypeScript execution)
    'cd /www/zhishuai/server && pm2 start "npx tsx src/index.ts" --name zhishuai-api -- -e production 2>&1',
    
    # Wait and check
    'sleep 5 && pm2 list 2>&1',
    
    # Check health endpoint
    'curl -s http://localhost:3001/health 2>&1',
    
    # Test login
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    
    # Test chat endpoint availability
    'TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get(\'data\',{}).get(\'token\',\'\'))" 2>/dev/null); echo "Token: $TOKEN"',
    
    # Check website still works
    'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/',
    
    # Save PM2 config
    'pm2 save 2>&1',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:800])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
