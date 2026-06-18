import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

commands = [
    # 1. Check the actual error from API error log
    ('cat /var/log/zhishuai/api-error-0.log 2>/dev/null | tail -50', 'API Error Log'),
    
    # 2. Check validate middleware (loginSchema)
    ('cat /www/zhishuai/server/src/middleware/validate.ts 2>/dev/null | head -80', 'Validate Middleware'),
    
    # 3. Check auth middleware (verifyPassword)
    ('cat /www/zhishuai/server/src/middleware/auth.ts 2>/dev/null | head -100', 'Auth Middleware'),
    
    # 4. Check SSL live directory for api subdomain
    ('ls -la /etc/letsencrypt/live/ 2>/dev/null', 'SSL Live Directory'),
    
    # 5. Test if api.baizhiji.net cert exists
    ('ls -la /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null || echo "CERT NOT FOUND"', 'API SSL Cert'),
    
    # 6. Nginx error log for api subdomain  
    ('sudo tail -20 /var/log/nginx/error.log 2>/dev/null', 'Nginx Error Log'),
    
    # 7. Test nginx config syntax
    ('sudo nginx -t 2>&1', 'Nginx Config Test'),
]

for cmd, label in commands:
    print(f'\n{"="*60}')
    print(f'>>> {label}')
    print('-'*40)
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out[:3000])
    if err.strip():
        print(f'STDERR: {err[:1000]}')

ssh.close()
