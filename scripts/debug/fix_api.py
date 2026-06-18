import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

# Check error logs
cmds = [
    # Check error logs
    'cat /home/ubuntu/.pm2/logs/zhishuai-api-error-1.log | tail -30',
    # Check current ecosystem.config
    'cat /www/zhishuai/ecosystem.config.js',
    # Check if tsx is available
    'which tsx 2>/dev/null || npx tsx --version 2>/dev/null || echo tsx-not-found',
    # Check if node_modules has tsx
    'ls /www/zhishuai/server/node_modules/.bin/tsx 2>/dev/null || echo no-tsx-binary',
    # Check dist/index.js exists
    'ls -la /www/zhishuai/server/dist/index.js 2>/dev/null || echo no-dist',
    # Check last successful build output
    'ls -la /www/zhishuai/server/dist/ 2>/dev/null | head -10 || echo no-dist-dir',
]

for cmd in cmds:
    print(f'\n=== {cmd[:60]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=15)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:500])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
