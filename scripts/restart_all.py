import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # Check API logs for startup errors
    'pm2 logs zhishuai-api --lines 30 --nostream 2>&1',
    # Start web process
    'cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1',
    # Check both processes
    'sleep 10 && pm2 list 2>&1',
    # Check API
    'curl -s http://localhost:3001/health',
    # Check web
    'curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"',
]

for cmd in cmds:
    print(f'\n=== {cmd[:70]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:1000])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
