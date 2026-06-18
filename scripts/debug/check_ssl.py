import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # 检查SSL证书文件是否存在
    'ls -la /etc/letsencrypt/ 2>/dev/null',
    'find /etc -name "*.pem" -path "*baizhiji*" 2>/dev/null',
    'find /etc -name "*.pem" -path "*ssl*" 2>/dev/null | head -20',
    
    # 检查nginx config中SSL证书的实际路径
    'grep ssl_certificate /etc/nginx/sites-enabled/baizhiji 2>/dev/null',
    'grep ssl_certificate /etc/nginx/sites-enabled/api-baizhiji 2>/dev/null',
    
    # 尝试sudo nginx -t
    'sudo nginx -t 2>&1',
    
    # 检查是否有self-signed证书
    'find /www/zhishuai/deploy -name "*.pem" -o -name "*.crt" -o -name "*.key" 2>/dev/null',
    'cat /www/zhishuai/deploy/setup-nginx.sh 2>/dev/null',
    
    # 检查certbot是否曾经成功运行
    'sudo certbot certificates 2>/dev/null',
    
    # 检查实际的SSL证书（nginx正在使用的）
    'sudo ls /etc/letsencrypt/live/ 2>/dev/null',
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
