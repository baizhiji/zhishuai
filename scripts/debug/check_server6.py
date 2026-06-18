import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # 检查域名DNS解析
    'dig baizhiji.net A +short 2>/dev/null || host baizhiji.net 2>/dev/null',
    'dig api.baizhiji.net A +short 2>/dev/null || host api.baizhiji.net 2>/dev/null',
    'dig www.baizhiji.net A +short 2>/dev/null || host www.baizhiji.net 2>/dev/null',
    
    # 检查SSL证书有效性
    'openssl x509 -in /etc/letsencrypt/live/api.baizhiji.net/fullchain.pem -noout -subject -dates 2>/dev/null || echo api SSL证书检查失败',
    'ls /etc/letsencrypt/live/ 2>/dev/null',
    'ls /etc/letsencrypt/live/baizhiji.net/ 2>/dev/null || echo baizhiji.net 无独立SSL证书',
    
    # 检查nginx完整配置(前站)
    'cat /etc/nginx/sites-enabled/baizhiji',
    
    # 检查API路由列表
    'curl -sk https://api.baizhiji.net/api 2>/dev/null || curl -sk https://baizhiji.net/api 2>/dev/null | head -5',
    
    # 检查数据库是否有数据
    'curl -sk https://api.baizhiji.net/api/health 2>/dev/null',
    
    # 检查certbot
    'which certbot 2>/dev/null && certbot certificates 2>/dev/null | head -20',
    
    # 检查nginx是否对baizhiji.net有SSL
    'grep -l "ssl_certificate" /etc/nginx/sites-enabled/* 2>/dev/null',
    
    # 检查PM2 web端配置细节
    'pm2 show zhishuai-web 2>/dev/null | head -30',
    
    # 检查数据库连接
    'mysql -h 172.19.0.13 -u root -pHao-20061218 -e "SHOW TABLES;" zhishuai 2>/dev/null || echo TDSQL连接失败',
    
    # 检查上传目录
    'ls -la /www/zhishuai/uploads/ 2>/dev/null || echo uploads目录不存在',
    'ls -la /www/zhishuai/server/uploads/ 2>/dev/null || echo server/uploads不存在',
    
    # 检查Redis
    'which redis-cli && redis-cli ping 2>/dev/null || echo redis-cli不可用',
    
    # 检查OSS配置是否完整
    'cat /www/zhishuai/server/.env | grep -i OSS 2>/dev/null || echo server .env无OSS配置',
    
    # 检查APK相关
    'ls /www/zhishuai/apk/ 2>/dev/null || echo 服务器上无APK目录',
    
    # 检查是否有域名对应的SSL
    'cat /etc/nginx/sites-enabled/baizhiji | grep ssl 2>/dev/null || echo baizhiji nginx配置无SSL',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=15)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    out = out_bytes.decode('utf-8', errors='replace').strip()
    err = err_bytes.decode('utf-8', errors='replace').strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:600])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:200].encode('ascii', 'replace').decode('ascii'))

c.close()
