import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # 检查本地代码和服务器代码的同步差异
    'cat /www/zhishuai/server/src/routes/auth.ts 2>/dev/null | wc -l',
    'cat /www/zhishuai/server/src/routes/ai-chat.ts 2>/dev/null | wc -l',
    'cat /www/zhishuai/server/src/routes/hot-topics.ts 2>/dev/null | wc -l',
    'cat /www/zhishuai/server/src/routes/settlement.ts 2>/dev/null | wc -l',
    
    # 检查服务器是否有完整的src目录
    'ls /www/zhishuai/server/src/routes/ 2>/dev/null | wc -l',
    'ls /www/zhishuai/server/src/routes/ 2>/dev/null',
    
    # 检查服务器是否有uploads和public目录权限
    'stat /www/zhishuai/server/public/ 2>/dev/null || echo public目录不存在',
    
    # 检查nginx是否有client_max_body_size配置(用于上传)
    'grep client_max_body_size /etc/nginx/sites-enabled/* 2>/dev/null || echo nginx没有配置上传大小限制',
    
    # 检查服务器是否配置了SSL证书（baizhiji.net）
    'ls /etc/letsencrypt/archive/baizhiji.net/ 2>/dev/null || echo baizhiji.net letsencrypt证书目录不存在',
    
    # 检查nginx是否在监听443
    'ss -tlnp 2>/dev/null | grep 443 || echo 443端口未监听',
    'ss -tlnp 2>/dev/null | grep 80 || echo 80端口未监听',
    
    # 检查是否已有DNS解析正确
    'curl -sI https://baizhiji.net 2>/dev/null | head -10',
    'curl -sI https://api.baizhiji.net/api/health 2>/dev/null | head -10',
    
    # 检查PM2 startup配置（是否开机自启）
    'pm2 startup 2>/dev/null | head -5',
    'systemctl is-enabled pm2-root 2>/dev/null || systemctl is-enabled pm2-ubuntu 2>/dev/null || echo PM2开机自启未配置',
    
    # 检查服务器上的git仓库状态
    'cd /www/zhishuai && git log --oneline -5 2>/dev/null || echo 无git仓库',
    'cd /www/zhishuai && git remote -v 2>/dev/null || echo 无git remote',
    
    # 检查APK build是否曾在服务器执行
    'which eas 2>/dev/null || which expo 2>/dev/null || echo 无expo/eas CLI',
    'npm list -g eas-cli 2>/dev/null || echo eas-cli未全局安装',
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
