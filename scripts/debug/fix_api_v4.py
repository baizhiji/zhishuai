import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Check dotenv location
    'find /www/zhishuai -name "dotenv" -type d 2>/dev/null | head -5',
    # Check index.ts first line (import dotenv)
    'head -5 /www/zhishuai/server/src/index.ts',
    # Check server tsconfig
    'cat /www/zhishuai/server/tsconfig.json',
    # Use ecosystem.config.js to start (the old working method)
    'pm2 delete zhishuai-api 2>&1',
    'cd /www/zhishuai && pm2 start ecosystem.config.js --only zhishu-api 2>&1',
    'sleep 10 && pm2 list 2>&1',
    'curl -s http://localhost:3001/health',
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:800])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
