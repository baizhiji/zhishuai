import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Kill any background node processes
    'pkill -f "node dist" 2>/dev/null; pkill -f "tsx" 2>/dev/null',
    
    # Add tsx as a dev dependency for the server
    'cd /www/zhishuai && pnpm add tsx --filter zhishuai-server --save-dev 2>&1 | tail -5',
    
    # Test running with tsx directly
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production npx tsx src/index.ts &',
    'sleep 15',
    'curl -s http://localhost:3001/health',
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    'pkill -f "tsx src/index" 2>/dev/null',
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
    if err and 'Warning' not in err and 'CLIXML' not in err and 'ValidationError' not in err and 'rate' not in err.lower():
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
