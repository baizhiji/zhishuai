import paramiko
import os

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)
sftp = c.open_sftp()

# Upload ALL modified source files (including validate.ts which differs on server)
local_base = 'c:/Users/Administrator/zhishuai/server/src'
files = [
    'middleware/validate.ts',
    'middleware/ai-quota.ts',
    'middleware/auth.ts',
    'routes/ai-chat.ts',
    'routes/auth.ts',
    'routes/code-assistant.ts',
    'routes/ai-enhanced.ts',
    'routes/ai-workflow.ts',
    'routes/admin-api-providers.ts',
    'routes/admin-features.ts',
    'routes/admin-agents.ts',
    'routes/admin-logs.ts',
    'routes/ai-config.ts',
    'routes/ai-config.routes.ts',
    'services/ai-workflow.ts',
    'services/chat-history.service.ts',
    'services/user-api-key.service.ts',
    'index.ts',
]

for f in files:
    local = os.path.join(local_base, f)
    remote = f'/www/zhishuai/server/src/{f}'
    if os.path.exists(local):
        print(f'Uploading {f}...')
        sftp.put(local, remote)
    else:
        print(f'SKIP {f}')

sftp.close()

# Now restart with tsx
cmds = [
    # Kill everything
    'pkill -f "node" 2>/dev/null; pkill -f "tsx" 2>/dev/null; pm2 delete all 2>&1',
    
    # Verify validate.ts is correct
    'head -6 /www/zhishuai/server/src/middleware/validate.ts',
    
    # Test validate import
    'cd /www/zhishuai/server && npx tsx -e "import { validate, sendCodeSchema } from \'./src/middleware/validate\'; console.log(typeof validate, typeof sendCodeSchema)"',
    
    # Start server with tsx using fork mode (no cluster)
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1',
    
    # Start web
    'cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1',
    
    # Wait and check
    'sleep 15 && pm2 list 2>&1',
    
    # Test API
    'curl -s http://localhost:3001/health',
    
    # Test login
    'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'',
    
    # Test website
    'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/',
    
    # Save
    'pm2 save 2>&1',
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
    if err and 'Warning' not in err and 'CLIXML' not in err and 'ValidationError' not in err and 'rate' not in err.lower() and 'trust' not in err.lower():
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
