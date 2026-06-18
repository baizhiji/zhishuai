import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

commands = [
    # 1. Auth route full content
    ('cat /www/zhishuai/server/src/routes/auth.ts 2>/dev/null', 'Auth Route Full'),
    
    # 2. Auth service files
    ('find /www/zhishuai/server/src -name "auth*" -type f 2>/dev/null', 'Auth Related Files'),
    
    # 3. Check if there's an auth service
    ('cat /www/zhishuai/server/src/services/auth.service.ts 2>/dev/null || cat /www/zhishuai/server/src/services/auth.ts 2>/dev/null', 'Auth Service'),
    
    # 4. API nginx HTTPS config
    ('cat /etc/nginx/sites-available/api-baizhiji.https 2>/dev/null', 'Nginx API HTTPS'),
    
    # 5. SSL certs detail
    ('ls -laR /etc/letsencrypt/ 2>/dev/null | head -30', 'SSL Certs Detail'),
    
    # 6. Test login via HTTPS
    ('curl -s -X POST https://baizhiji.net/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\"}" -k 2>/dev/null', 'Login via HTTPS'),
    
    # 7. Check User table for the phone
    ('cd /www/zhishuai/server && npx prisma db execute --stdin <<< "SELECT id, phone, username, role, password FROM User WHERE phone=\'18601655222\' LIMIT 1;" 2>/dev/null', 'Check User in DB'),
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
