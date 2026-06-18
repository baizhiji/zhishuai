import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=60):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err_bytes = stderr.read()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out: print(out[:1500])
    err_clean = err
    if 'CLIXML' in err_clean:
        err_clean = ''
    if err_clean: print('ERR:', err_clean[:500])
    return out

# Step 1: Use pnpm to install all dependencies properly (pnpm is the right tool for monorepo)
run('cd /www/zhishuai && pnpm install 2>&1 | tail -20', timeout=120)

# Step 2: Verify key packages are linked into server/node_modules
run('ls /www/zhishuai/server/node_modules/swagger-ui-express/package.json 2>&1')
run('ls /www/zhishuai/server/node_modules/swagger-jsdoc/package.json 2>&1')
run('ls /www/zhishuai/server/node_modules/cookie-parser/package.json 2>&1')
run('ls /www/zhishuai/server/node_modules/dotenv/package.json 2>&1')

# Step 3: Kill everything and restart clean
run('pm2 delete all 2>/dev/null; pkill -f tsx 2>/dev/null; pkill -f "next start" 2>/dev/null')

# Step 4: Start API
run('cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1')

# Step 5: Start Web
run('cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1')

# Step 6: Wait
run('sleep 25')

# Step 7: Check
run('pm2 list 2>&1')
run('curl -s http://localhost:3001/api/health')
run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

# Step 8: If health fails, check errors
run('pm2 logs zhishuai-api --err --lines 20 --nostream 2>&1')
run('pm2 logs zhishuai-api --lines 10 --nostream 2>&1')

# Step 9: Save
run('pm2 save 2>&1')

c.close()
print('\n=== ALL DONE ===')
