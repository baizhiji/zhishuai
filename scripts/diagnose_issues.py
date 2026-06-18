import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

commands = [
    # 1. PM2 status
    ('cd /www/zhishuai && npx pm2 list 2>/dev/null', 'PM2 Status'),
    
    # 2. API health check (local)
    ('curl -s http://localhost:3001/api/health 2>/dev/null', 'API Local Health'),
    
    # 3. Web frontend check (local)
    ('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null', 'Web Local Status'),
    
    # 4. Check if api.baizhiji.net resolves
    ('dig +short api.baizhiji.net 2>/dev/null || nslookup api.baizhiji.net 2>/dev/null | grep Address', 'DNS api.baizhiji.net'),
    
    # 5. Nginx sites enabled
    ('ls -la /etc/nginx/sites-enabled/ 2>/dev/null', 'Nginx Sites Enabled'),
    
    # 6. Nginx config for baizhiji
    ('cat /etc/nginx/sites-available/baizhiji.net 2>/dev/null', 'Nginx Baizhiji Config'),
    
    # 7. Check if there's a separate API subdomain config
    ('ls /etc/nginx/sites-available/ 2>/dev/null', 'Nginx Sites Available'),
    
    # 8. Check login endpoint
    ('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\"}" 2>/dev/null', 'Login Test'),
    
    # 9. Check auth route exists
    ('ls /www/zhishuai/server/src/routes/ 2>/dev/null', 'Available Routes'),
]

for cmd, label in commands:
    print(f'\n{"="*60}')
    print(f'>>> {label}')
    print(f'>>> Command: {cmd[:80]}...')
    print('-'*40)
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out[:2000])
    if err.strip():
        print(f'STDERR: {err[:500]}')

ssh.close()
