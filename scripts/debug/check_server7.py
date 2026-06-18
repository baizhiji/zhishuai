import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # 检查SSL证书详情
    'certbot certificates 2>/dev/null',
    'ls -la /etc/letsencrypt/live/ 2>/dev/null',
    'ls -la /etc/letsencrypt/live/baizhiji.net/ 2>/dev/null',
    'ls -la /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null',
    
    # 检查nginx SSL配置是否完整
    'nginx -t 2>&1',
    
    # 检查curl HTTPS是否正常工作
    'curl -svk https://baizhiji.net 2>&1 | head -30',
    'curl -svk https://api.baizhiji.net/api/health 2>&1 | head -30',
    
    # 检查数据库表数量和关键数据
    'mysql -h 172.19.0.13 -u root -pHao-20061218 -e "SELECT COUNT(*) as user_count FROM User;" zhishuai 2>/dev/null',
    
    # 检查server .env中的JWT_SECRET - 是否还是默认值
    'grep JWT_SECRET /www/zhishuai/server/.env 2>/dev/null',
    
    # 检查uploads目录是否存在并创建
    'ls -la /www/zhishuai/server/public/ 2>/dev/null || echo public目录不存在',
    'ls -la /www/zhishuai/server/uploads/ 2>/dev/null || echo uploads目录不存在',
    
    # 检查nginx是否配置了文件上传代理
    'grep -r "upload" /etc/nginx/sites-enabled/ 2>/dev/null || echo nginx无upload配置',
    
    # 检查数据库migration状态
    'ls /www/zhishuai/server/prisma/migrations/ 2>/dev/null',
    
    # 检查Redis是否运行
    'systemctl status redis 2>/dev/null | head -5 || systemctl status redis-server 2>/dev/null | head -5 || echo redis服务未找到',
    'ss -tlnp 2>/dev/null | grep 6379 || echo 6379端口未监听',
    
    # 检查prisma migration状态
    'cd /www/zhishuai/server && npx prisma migrate status 2>/dev/null || echo prisma migrate status失败',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=20)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:600])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
