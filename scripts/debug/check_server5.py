import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    'cat /etc/nginx/sites-enabled/baizhiji',
    'cat /etc/nginx/sites-enabled/api-baizhiji',
    'cat /www/zhishuai/deploy/nginx-baizhiji.conf',
    'dig baizhiji.net +short 2>/dev/null || nslookup baizhiji.net 2>/dev/null | tail -5',
    'dig api.baizhiji.net +short 2>/dev/null || nslookup api.baizhiji.net 2>/dev/null | tail -5',
    'dig www.baizhiji.net +short 2>/dev/null || nslookup www.baizhiji.net 2>/dev/null | tail -5',
    'curl -sk https://baizhiji.net 2>/dev/null | head -10 || echo baizhiji.net HTTPS失败',
    'curl -sk https://api.baizhiji.net/api/health 2>/dev/null || echo api.baizhiji.net HTTPS失败',
    'curl -s http://baizhiji.net 2>/dev/null | head -5 || echo baizhiji.net HTTP失败',
    'cat /www/zhishuai/server/src/routes/auth.ts 2>/dev/null | head -60',
    'cat /www/zhishuai/server/src/middleware/auth.ts 2>/dev/null | head -40',
    'cat /www/zhishuai/server/src/index.ts 2>/dev/null | head -60',
    'ls /www/zhishuai/server/prisma/migrations/init_mysql/ 2>/dev/null',
    'cat /www/zhishuai/server/prisma/migrations/init_mysql/migration.sql 2>/dev/null | head -50',
    'ls /www/zhishuai/apk/ 2>/dev/null || echo APK目录不存在于服务器',
    'which expo 2>/dev/null || which eas 2>/dev/null || echo expo/eas CLI未安装',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = c.exec_command(cmd)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:800])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
