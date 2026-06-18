import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

commands = [
    # 1. Check API logs for login error
    ('cd /www/zhishuai && npx pm2 logs zhishuai-api --lines 50 --nostream 2>/dev/null', 'API Recent Logs'),
    
    # 2. Check auth route file
    ('cat /www/zhishuai/server/src/routes/auth.ts 2>/dev/null | head -100', 'Auth Route File'),
    
    # 3. Check auth service
    ('ls /www/zhishuai/server/src/services/auth* 2>/dev/null', 'Auth Service Files'),
    
    # 4. API subdomain nginx config (HTTP)
    ('cat /etc/nginx/sites-available/api-baizhiji 2>/dev/null', 'Nginx API Config HTTP'),
    
    # 5. API subdomain nginx config (HTTPS)
    ('cat /etc/nginx/sites-available/api-baizhiji.https 2>/dev/null', 'Nginx API Config HTTPS'),
    
    # 6. Main site nginx config  
    ('cat /etc/nginx/sites-available/baizhiji 2>/dev/null', 'Nginx Main Config'),
    
    # 7. Check SSL certs
    ('ls -la /etc/letsencrypt/live/ 2>/dev/null && ls -la /etc/letsencrypt/live/baizhiji.net/ 2>/dev/null', 'SSL Certs'),
    
    # 8. Test login with verbose error
    ('curl -sv -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\"}" 2>&1 | tail -20', 'Login Verbose'),
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
        print(f'STDERR: {err[:500]}')

ssh.close()
