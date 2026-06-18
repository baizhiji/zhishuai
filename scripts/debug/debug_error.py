import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:2000].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err: print('ERR:', err[:500].encode('ascii', 'replace').decode('ascii'))
    return out

# Get full error log - more lines
run('cat /home/ubuntu/.pm2/logs/zhishuai-api-error.log | tail -80')

# Check which module is missing
run('cd /www/zhishuai/server && npx tsx src/index.ts 2>&1 | head -50', timeout=10)

# Check the imports in ai-chat.ts that might be problematic
run('grep -n "import.*from" /www/zhishuai/server/src/routes/ai-chat.ts | head -20')

# Check user-api-key.service.ts imports
run('grep -n "import.*from" /www/zhishuai/server/src/services/user-api-key.service.ts | head -10')

# Check if @prisma/client is available
run('ls /www/zhishuai/server/node_modules/.prisma/client/index.js 2>&1; ls /www/zhishuai/node_modules/.prisma/client/index.js 2>&1')

c.close()
print('\n=== DONE ===')
