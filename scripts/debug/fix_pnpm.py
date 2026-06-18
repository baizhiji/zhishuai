import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Stop all
    'pm2 delete all 2>&1',
    
    # The workspace uses pnpm. Check the pnpm-workspace.yaml
    'cat /www/zhishuai/pnpm-workspace.yaml 2>/dev/null || echo no-workspace-config',
    
    # Check which packages are installed in server via pnpm
    'ls /www/zhishuai/server/node_modules/cookie-parser 2>/dev/null || echo "cookie-parser not in server node_modules"',
    'ls /www/zhishuai/node_modules/cookie-parser 2>/dev/null || echo "cookie-parser not in root node_modules"',
    
    # Find cookie-parser in pnpm store
    'find /www/zhishuai/node_modules/.pnpm -name "cookie-parser" -type d 2>/dev/null | head -3',
    
    # The key insight: pnpm creates symlinks from node_modules to .pnpm store
    # Check if the symlink exists
    'ls -la /www/zhishuai/node_modules/cookie-parser 2>/dev/null || echo no-symlink',
    
    # Cookie-parser should be in server/package.json deps
    'grep cookie-parser /www/zhishuai/server/package.json || echo not-in-package-json',
    
    # The real fix: set NODE_PATH to include the workspace root node_modules
    # This way node can resolve all pnpm-installed modules
    # Test with NODE_PATH
    'cd /www/zhishuai/server && NODE_PATH=/www/zhishuai/node_modules node -e "require(\'dotenv/config\'); require(\'cookie-parser\'); require(\'cors\'); console.log(\'All OK\')"',
    
    # Now start API with NODE_PATH set
    'cd /www/zhishuai/server && NODE_PATH=/www/zhishuai/node_modules PORT=3001 NODE_ENV=production node dist/index.js &',
    'sleep 10',
    'curl -s http://localhost:3001/health',
    # Test login
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
