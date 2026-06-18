import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=20):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:1000].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err: print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))
    return out

# Check PM2 status
run('pm2 list 2>&1')

# Check API logs
run('pm2 logs zhishuai-api --lines 40 --nostream 2>&1')

# Check health
run('curl -s http://localhost:3001/api/health')

# Check login
run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

# If API errored, check the error log
run('pm2 logs zhishuai-api --err --lines 20 --nostream 2>&1')

# Check web status
run('pm2 logs zhishuai-web --lines 10 --nostream 2>&1')

c.close()
print('\n=== DONE ===')
