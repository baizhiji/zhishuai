import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

commands = [
    ('curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/ -k 2>/dev/null', '1. baizhiji.net (Main Site)'),
    ('curl -s https://baizhiji.net/api/health -k 2>/dev/null', '2. baizhiji.net/api/health'),
    ('curl -s -o /dev/null -w "%{http_code}" https://api.baizhiji.net/api/health -k 2>/dev/null', '3. api.baizhiji.net/api/health'),
    ('curl -s https://api.baizhiji.net/api/health -k 2>/dev/null', '4. api.baizhiji.net health body'),
    ('curl -s -X POST https://baizhiji.net/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\",\"loginType\":\"user\"}" -k 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\\\"Login: {d.get(\\\"success\\\", d.get(\\\"error\\\", d))} | User: {d.get(\\\"data\\\",{}).get(\\\"user\\\",{{}}).get(\\\"name\\\",\\\"N/A\\\")} Role: {d.get(\\\"data\\\",{}).get(\\\"user\\\",{{}}).get(\\\"role\\\",\\\"N/A\\\")}\\")" 2>/dev/null || curl -s -X POST https://baizhiji.net/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"20061218\",\"loginType\":\"user\"}" -k 2>/dev/null', '5. Login Test (Terminal)'),
    ('cd /www/zhishuai && npx pm2 list 2>/dev/null', '6. PM2 Processes'),
    ('sudo nginx -t 2>&1', '7. Nginx Config'),
]

print('='*60)
print('FINAL VERIFICATION REPORT')
print('='*60)

for cmd, label in commands:
    print(f'\n>>> {label}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out:
        print(f'    {out[:300]}')
    else:
        print('    (no output)')

ssh.close()
