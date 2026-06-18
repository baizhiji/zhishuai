import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=20):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:1500].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err and 'Warning' not in err: print('ERR:', err[:500].encode('ascii', 'replace').decode('ascii'))
    return out

# Check PM2 status
run('pm2 list 2>&1')

# Check error log
run('cat /home/ubuntu/.pm2/logs/zhishuai-api-error.log | tail -30')

# Check output log
run('cat /home/ubuntu/.pm2/logs/zhishuai-api-out.log | tail -20')

# Try health with verbose curl
run('curl -v http://localhost:3001/api/health 2>&1')

# If still failing, try running tsx directly to see the error
run('cd /www/zhishuai/server && timeout 10 npx tsx src/index.ts 2>&1 | head -40', timeout=15)

c.close()
print('\n=== DONE ===')
