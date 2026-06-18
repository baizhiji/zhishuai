import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Stop all PM2
    'pm2 delete all 2>&1',
    
    # Full npm install in server directory (resolves all module issues)
    'cd /www/zhishuai/server && npm install 2>&1 | tail -10',
    
    # Verify key modules can be resolved
    'cd /www/zhishuai/server && node -e "require(\'dotenv/config\'); require(\'cookie-parser\'); require(\'cors\'); require(\'express\'); console.log(\'All core modules OK\')"',
    
    # Start API directly first to test
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production node dist/index.js &',
    'sleep 8',
    'curl -s http://localhost:3001/health',
    # Kill test
    'pkill -f "node dist/index" 2>/dev/null',
    
    # Now start both with PM2 using ecosystem config (but with NODE_PATH set)
    'cd /www/zhishuai && pm2 start ecosystem.config.js 2>&1',
    'sleep 15 && pm2 list 2>&1',
    
    # Final tests
    'curl -s http://localhost:3001/health',
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/',
    
    'pm2 save 2>&1',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=120)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:600])
    if err and 'Warning' not in err and 'CLIXML' not in err and 'ValidationError' not in err and 'rate' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
