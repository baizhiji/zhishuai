import paramiko, time, sys, io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=60):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:1500].encode('ascii', 'replace').decode('ascii'))
    err_clean = err
    if 'CLIXML' in err_clean:
        err_clean = ''
    if err_clean: print('ERR:', err_clean[:500].encode('ascii', 'replace').decode('ascii'))
    return out

# pnpm install should have already succeeded from previous run. Verify key deps:
run('ls /www/zhishuai/server/node_modules/swagger-ui-express 2>&1')
run('ls /www/zhishuai/server/node_modules/dotenv 2>&1')
run('ls /www/zhishuai/server/node_modules/cookie-parser 2>&1')

# Kill and restart
run('pm2 delete all 2>&1 | tail -5; pkill -f tsx 2>/dev/null; pkill -f "next start" 2>/dev/null')

# Start API with tsx
run('cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1')

# Start Web
run('cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1')

# Wait for startup
run('sleep 25')

# Check PM2
run('pm2 list 2>&1')

# Test health endpoint
run('curl -s http://localhost:3001/api/health')

# Test login
run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

# Check errors if health failed
run('pm2 logs zhishuai-api --err --lines 20 --nostream 2>&1')
run('pm2 logs zhishuai-api --lines 10 --nostream 2>&1')

# Save
run('pm2 save 2>&1')

c.close()
print('\n=== ALL DONE ===')
