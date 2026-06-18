import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    'ls -la /www/zhishuai/',
    'ls -la /www/zhishuai/server/',
    'ls -la /www/zhishuai/web/',
    'ls -la /www/zhishuai/server/dist/ 2>/dev/null | head -15',
    'ls -la /www/zhishuai/web/.next/ 2>/dev/null | head -15',
    'cat /www/zhishuai/server/.env 2>/dev/null',
    'cat /www/zhishuai/server/prisma/schema.prisma 2>/dev/null | head -30',
    'cat /etc/nginx/sites-enabled/zhishuai.conf 2>/dev/null || cat /etc/nginx/conf.d/zhishuai.conf 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null | head -40',
    'ls /etc/nginx/conf.d/ 2>/dev/null',
    'ls /etc/nginx/sites-enabled/ 2>/dev/null',
    'pm2 env 0 2>/dev/null | head -30',
    'pm2 env 3 2>/dev/null | head -30',
    'cat /www/zhishuai/server/ecosystem.config.js 2>/dev/null || cat /www/zhishuai/ecosystem.config.js 2>/dev/null',
    'cat /www/zhishuai/web/package.json 2>/dev/null',
    'cat /www/zhishuai/server/package.json 2>/dev/null | head -40',
    'curl -sk https://150.109.60.130/api/auth/login -X POST -H "Content-Type: application/json" -d "{}" 2>/dev/null',
    'curl -sk https://150.109.60.130/api/auth/register -X POST -H "Content-Type: application/json" -d "{}" 2>/dev/null',
    'curl -sk https://150.109.60.130/api/dashboard 2>/dev/null',
    'ls /www/zhishuai/server/prisma/migrations/ 2>/dev/null',
    'cat /www/zhishuai/apk/eas.json 2>/dev/null || echo apk eas.json不存在',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:600])
    if err and 'Warning' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
