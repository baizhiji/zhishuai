import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=60):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    out_safe = out.encode('ascii', 'replace').decode('ascii')
    if out_safe: print(out_safe[:1500])
    err_clean = err.replace('#< CLIXML', '').strip() if '#< CLIXML' not in err[:20] else ''
    if err_clean: print('ERR:', err_clean[:500].encode('ascii', 'replace').decode('ascii'))
    return out

# Use pnpm add to explicitly install missing deps into server package
# This will properly link them in pnpm's symlink structure
run('cd /www/zhishuai && pnpm add swagger-ui-express swagger-jsdoc --filter zhishuai-server 2>&1 | tail -15', timeout=120)

# Also check if pino-pretty is linked (needed for dev logging)
run('ls /www/zhishuai/server/node_modules/pino-pretty 2>&1 | head -5')

# Verify swagger-ui-express is now linked
run('ls /www/zhishuai/server/node_modules/swagger-ui-express/package.json 2>&1')

# Restart API
run('pm2 delete zhishuai-api 2>/dev/null; pkill -f "tsx src/index" 2>/dev/null')
run('cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1')

# Wait and test
run('sleep 25')
run('pm2 list 2>&1')
run('curl -s http://localhost:3001/api/health')
run('pm2 logs zhishuai-api --err --lines 10 --nostream 2>&1')
run('pm2 save 2>&1')

c.close()
print('\n=== DONE ===')
