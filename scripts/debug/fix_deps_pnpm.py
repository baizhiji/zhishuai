import paramiko
import json

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

# First, check all imports in the server/src/index.ts and find missing deps
stdin, stdout, stderr = c.exec_command('head -20 /www/zhishuai/server/src/index.ts', timeout=10)
index_ts = stdout.read().decode('utf-8', errors='replace')
print('index.ts imports:')
print(index_ts[:500])

# Check current server package.json dependencies
stdin, stdout, stderr = c.exec_command('python3 -c "import json; d=json.load(open(\'/www/zhishuai/server/package.json\')); print(json.dumps(list(d.get(\'dependencies\',{}).keys())[:30]))"', timeout=10)
deps = stdout.read().decode('utf-8', errors='replace').strip()
print('Current deps:', deps)

# Add missing dependencies using pnpm
cmds = [
    # Add cookie-parser and other missing deps with pnpm
    'cd /www/zhishuai && pnpm add cookie-parser --filter zhishuai-server 2>&1 | tail -10',
    
    # Check if cookie-parser is now available
    'cd /www/zhishuai/server && node -e "require(\'cookie-parser\'); console.log(\'OK\')" 2>&1',
    
    # Now try to start the server
    'pm2 delete all 2>&1',
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production node dist/index.js &',
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
    if err and 'Warning' not in err and 'CLIXML' not in err and 'ValidationError' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
