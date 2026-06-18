import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Delete errored api
    'pm2 delete zhishuai-api 2>&1',
    
    # The old method used node dist/index.js and worked. Let's fix the build.
    # First, install missing dependencies
    'cd /www/zhishuai/server && npm install dotenv 2>&1 | tail -5',
    
    # Exclude __tests__ from compilation
    'cat /www/zhishuai/server/tsconfig.json',
    
    # Now build with tsx directly using proper module resolution
    # Use ecosystem.config.js approach (the old working one)
    'cat /www/zhishuai/ecosystem.config.js',
    
    # Let's try running with node + tsx loader (register)
    'cd /www/zhishuai/server && node --import tsx src/index.ts 2>&1 &',
    'sleep 8',
    'curl -s http://localhost:3001/health',
    # Kill the background process
    'kill %1 2>/dev/null',
    
    # Check if dotenv is available
    'ls /www/zhishuai/server/node_modules/dotenv 2>/dev/null || ls /www/zhishuai/node_modules/dotenv 2>/dev/null || echo no-dotenv',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=20)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').decode('ascii')[:500]
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:500])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300])

c.close()
print('\n=== DONE ===')
