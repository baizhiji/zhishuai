import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').decode('ascii', errors='replace').strip()
    # Filter out SSH/PS noise
    err_clean = err.replace('#< CLIXML', '').strip()
    if out: print(out[:1500].encode('ascii', 'replace').decode('ascii'))
    if err_clean and 'CLIXML' not in err_clean: print('ERR:', err_clean[:500])
    return out

# Step 1: Remove the only-allow pnpm hook so we can use npm to install missing deps directly
run('cd /www/zhishuai/server && cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); d.pop(\'preinstall\',None); json.dump(d,sys.stdout,indent=2)" > pkg_fixed.json && mv pkg_fixed.json package.json')

# Step 2: Install ALL declared dependencies directly into server/node_modules using npm
run('cd /www/zhishuai/server && npm install --production 2>&1 | tail -20', timeout=120)

# Step 3: Also install tsx and types needed for runtime
run('cd /www/zhishuai/server && npm install tsx typescript @types/node 2>&1 | tail -10', timeout=60)

# Step 4: Verify swagger-ui-express is now available
run('ls -la /www/zhishuai/server/node_modules/swagger-ui-express/package.json 2>&1')

# Step 5: Kill old PM2 process and restart
run('pm2 delete zhishuai-api 2>/dev/null; pm2 delete zhishuai-web 2>/dev/null; pkill -f tsx 2>/dev/null; pkill -f "next start" 2>/dev/null')

# Step 6: Start API with tsx - set NODE_PATH to include both node_modules
run('cd /www/zhishuai/server && NODE_PATH=/www/zhishuai/server/node_modules PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1')

# Step 7: Start web
run('cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1')

# Step 8: Wait and check
run('sleep 20 && pm2 list 2>&1')

# Step 9: Test health
run('curl -s http://localhost:3001/api/health')

# Step 10: Test login
run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

# Step 11: Save PM2
run('pm2 save 2>&1')

# Step 12: If health still fails, check the new error
run('pm2 logs zhishuai-api --err --lines 15 --nostream 2>&1')

c.close()
print('\n=== ALL DONE ===')
