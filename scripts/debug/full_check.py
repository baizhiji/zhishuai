import paramiko
import sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

cmds = [
    # PM2 status
    'pm2 list',
    # Test API health
    'curl -s http://localhost:3001/health',
    # Test web
    'curl -s -o /dev/null -w "%{http_code}" https://baizhiji.net/',
    # Check .env
    'cat /www/zhishuai/server/.env',
    # Check current schema tables
    'cd /www/zhishuai/server && npx prisma db pull --print 2>/dev/null | head -100',
    # Check nginx config
    'cat /etc/nginx/sites-enabled/zhishuai.conf',
    # Check SSL certs
    'ls -la /etc/ssl/certs/zhishuai/ 2>/dev/null || ls -la /www/ssl/ 2>/dev/null || echo no-ssl-dir',
    # Check uploads
    'ls -la /www/zhishuai/server/uploads/ 2>/dev/null || echo no-uploads',
    # Check API key feature
    'grep -r "apiKey\\|api_key\\|APIKey" /www/zhishuai/server/src/ --include="*.ts" -l 2>/dev/null || echo no-apikey-files',
    # Check auth routes
    'cat /www/zhishuai/server/src/routes/auth.ts 2>/dev/null | head -80',
    # Check user model fields
    'cd /www/zhishuai/server && npx prisma db pull --print 2>/dev/null | grep -A 30 "model User"',
    # Check sms service
    'cat /www/zhishuai/server/src/services/sms.service.ts 2>/dev/null || echo no-sms-service',
    # Check AI service
    'cat /www/zhishuai/server/src/services/ai.service.ts 2>/dev/null | head -60 || echo no-ai-service',
    # Check chat routes
    'cat /www/zhishuai/server/src/routes/chat.ts 2>/dev/null | head -80 || echo no-chat-routes',
    # Check redis
    'redis-cli ping 2>/dev/null || echo redis-not-running',
    # MySQL - check users table structure
    'mysql -h 172.19.0.13 -u root -pHao-20061218 -e "DESCRIBE User;" zhishuai 2>/dev/null',
    # MySQL - check if apiKey column exists
    'mysql -h 172.19.0.13 -u root -pHao-20061218 -e "SHOW COLUMNS FROM User LIKE \'%api%\' OR SHOW COLUMNS FROM User LIKE \'%key%\';" zhishuai 2>/dev/null',
    # Check latest git log on server
    'cd /www/zhishuai && git log --oneline -5 2>/dev/null || echo no-git',
    # Check package versions
    'cat /www/zhishuai/server/package.json | head -30',
    # Check web build
    'ls -la /www/zhishuai/web/dist/ 2>/dev/null | head -10 || echo no-web-dist',
    # Check if web is built
    'cat /www/zhishuai/web/package.json | head -20 2>/dev/null || echo no-web-pkg',
]

for cmd in cmds:
    print(f'\n=== {cmd[:60]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        safe = out.encode('ascii', 'replace').decode('ascii')
        print(safe[:600])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DONE ===')
