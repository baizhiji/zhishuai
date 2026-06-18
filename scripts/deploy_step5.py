import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=30)

def run(cmd, timeout=60):
    print(f'>>> {cmd[:80]}')
    try:
        stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        safe = out.encode('ascii', 'replace').decode('ascii')
        if safe: print(safe[:2000])
        return out, err
    except Exception as e:
        print(f'FAILED: {e}')
        return '', str(e)

# 1. Upload fixed files
print('=== Upload fixed files ===')
sftp = c.open_sftp()

files_to_upload = [
    ('server/src/services/automation/task-executor.ts', '/www/zhishuai/server/src/services/automation/task-executor.ts'),
    ('server/src/routes/ai.ts', '/www/zhishuai/server/src/routes/ai.ts'),
    ('server/src/routes/oauth.ts', '/www/zhishuai/server/src/routes/oauth.ts'),
    ('server/src/services/ai-service.ts', '/www/zhishuai/server/src/services/ai-service.ts'),
]

for local_rel, remote in files_to_upload:
    local = 'c:/Users/Administrator/zhishuai/' + local_rel
    try:
        sftp.put(local, remote)
        print(f'  OK: {local_rel}')
    except Exception as e:
        print(f'  ERR: {local_rel}: {e}')
sftp.close()

# 2. Restart API
print('\n=== Restart API ===')
run('pm2 delete zhishuai-api 2>/dev/null; pkill -f tsx 2>/dev/null; sleep 3')

run('cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1', timeout=30)

print('\nWaiting 30s...')
time.sleep(30)

# 3. Verify
print('\n=== Verify API ===')
out, _ = run('curl -s http://localhost:3001/api/health')
if out and 'ok' in out:
    print('\n*** API is running! ***')
else:
    print('\n*** API not running, checking error logs ***')
    run('tail -30 /home/ubuntu/.pm2/logs/zhishuai-api-error.log 2>/dev/null')

# 4. Save PM2
run('pm2 save 2>&1')

c.close()
print('\nDONE')
