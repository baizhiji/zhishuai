import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Use pnpm to install all dependencies properly
    'cd /www/zhishuai && pnpm install 2>&1 | tail -10',
    
    # Now test if dotenv resolves from server directory
    'cd /www/zhishuai/server && node -e "console.log(require.resolve(\'dotenv/config\'))"',
    
    # Test cookie-parser
    'cd /www/zhishuai/server && node -e "console.log(require.resolve(\'cookie-parser\'))"',
    
    # Build the project (now with all deps)
    'cd /www/zhishuai/server && npm run build 2>&1 | tail -10',
    
    # Start both services with PM2
    'cd /www/zhishuai && pm2 start ecosystem.config.js 2>&1',
    
    # Wait and check
    'sleep 15 && pm2 list 2>&1',
    
    # Test API
    'curl -s http://localhost:3001/health',
    
    # Test login
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    
    # Save PM2
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
    if err and 'Warning' not in err and 'CLIXML' not in err and 'ValidationError' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
