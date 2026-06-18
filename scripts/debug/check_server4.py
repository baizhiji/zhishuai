import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    'cat /www/zhishuai/server/.env',
    'cat /www/zhishuai/.env',
    'cat /www/zhishuai/web/.env.production 2>/dev/null || cat /www/zhishuai/web/.env 2>/dev/null || echo web无env文件',
    'cat /etc/nginx/sites-enabled/zhishuai.conf 2>/dev/null',
    'cat /etc/nginx/conf.d/zhishuai.conf 2>/dev/null',
    'ls /etc/nginx/sites-enabled/',
    'ls /etc/nginx/conf.d/',
    'cat /www/zhishuai/ecosystem.config.js',
    'cat /www/zhishuai/server/ecosystem.config.cjs',
    'cat /www/zhishuai/deploy/nginx.conf 2>/dev/null || ls /www/zhishuai/deploy/',
    'curl -sk https://150.109.60.130/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"password\":\"test123\"}" 2>/dev/null',
    'curl -sk https://150.109.60.130/api/auth/register -X POST -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"password\":\"test123\",\"name\":\"test\"}" 2>/dev/null',
    'cat /www/zhishuai/server/prisma/schema.prisma | head -40',
    'mysql -u root -e "SHOW DATABASES;" 2>/dev/null || echo mysql命令失败',
    'cat /www/zhishuai/apk/eas.json 2>/dev/null',
    'cat /www/zhishuai/apk/app.json 2>/dev/null',
    'ls /www/zhishuai/apk/ 2>/dev/null',
    'cat /www/zhishuai/web/.next/BUILD_ID 2>/dev/null',
    'pm2 logs zhishuai-api --lines 20 --nostream 2>/dev/null',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:800])
    if err and 'Warning' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
