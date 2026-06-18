import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Check if pnpm or npm is being used
    'cat /www/zhishuai/server/package-lock.json 2>/dev/null | head -5 || echo no-package-lock',
    'cat /www/zhishuai/package-lock.json 2>/dev/null | head -5 || echo no-root-lock',
    'ls /www/zhishuai/pnpm-lock.yaml 2>/dev/null && echo has-pnpm-lock || echo no-pnpm-lock',
    'which pnpm 2>/dev/null || echo no-pnpm',
    
    # The project uses pnpm. Let's install dependencies properly
    # Install dotenv and other critical deps in server
    'cd /www/zhishuai/server && npm install dotenv cors helmet express express-rate-limit 2>&1 | tail -10',
    
    # Now test if node can resolve dotenv
    'cd /www/zhishuai/server && node -e "console.log(require.resolve(\'dotenv/config\'))"',
    
    # Now start the server
    'cd /www/zhishuai/server && node dist/index.js 2>&1 &',
    'sleep 10',
    'curl -s http://localhost:3001/health',
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    'pkill -f "node dist/index" 2>/dev/null',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:600])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
