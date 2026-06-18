import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Kill all processes first
    'pkill -f "tsx" 2>/dev/null; pkill -f "node dist" 2>/dev/null; pm2 delete all 2>&1',
    
    # Check auth.ts on server to make sure it matches local
    'head -10 /www/zhishuai/server/src/routes/auth.ts',
    
    # Check validate.ts on server
    'head -10 /www/zhishuai/server/src/middleware/validate.ts',
    
    # Verify the validate export works
    'cd /www/zhishuai/server && npx tsx -e "import { validate } from \'./src/middleware/validate\'; console.log(typeof validate)" 2>&1',
    
    # Try running index.ts with tsx but without the problematic route
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production node --import tsx/esm src/index.ts 2>&1 &',
    'sleep 10',
    'curl -s http://localhost:3001/health',
    'pkill -f "node --import" 2>/dev/null',
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
