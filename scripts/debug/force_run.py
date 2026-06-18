import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Kill all PM2
    'pm2 delete all 2>&1',
    
    # Check dist status - was build successful?
    'ls -la /www/zhishuai/server/dist/ | head -15',
    # Check if the dist files were actually rebuilt
    'stat /www/zhishuai/server/dist/index.js 2>&1',
    
    # The server was previously working with the old dist/index.js. Let's just
    # run node directly on the old dist and then update specific files.
    # First, check what the old index.js imports
    'head -20 /www/zhishuai/server/dist/index.js',
    
    # Check if dotenv is in server/node_modules (not workspace level)
    'ls /www/zhishuai/server/node_modules/dotenv 2>/dev/null || echo "no server-level dotenv"',
    'ls /www/zhishuai/node_modules/dotenv 2>/dev/null || echo "no workspace-level dotenv"',
    
    # Check NODE_PATH for module resolution
    'node -e "console.log(require.resolve(\'dotenv/config\'))" 2>&1 || echo "cannot resolve dotenv"',
    
    # Try running the server directly from dist with NODE_PATH set
    'cd /www/zhishuai/server && NODE_PATH=/www/zhishuai/node_modules node dist/index.js 2>&1 &',
    'sleep 10',
    'curl -s http://localhost:3001/health',
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    # Kill the test process
    'pkill -f "node dist/index.js" 2>/dev/null',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=20)
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
