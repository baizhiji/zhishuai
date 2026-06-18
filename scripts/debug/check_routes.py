import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    out_safe = out.encode('ascii', 'replace').decode('ascii')
    if out_safe: print(out_safe[:2000])
    return out

# Check what routes ai-chat.ts actually defines on the server
run('grep -n "router\\.get|router\\.post|router\\.put|router\\.delete|router\\.patch" /www/zhishuai/server/src/routes/ai-chat.ts')

# Check what routes ai-config.ts defines
run('grep -n "router\\.get|router\\.post|router\\.put|router\\.delete|router\\.patch" /www/zhishuai/server/src/routes/ai-config.ts')

# Check the index.ts route registrations for these routes
run('grep "ai-config" /www/zhishuai/server/src/index.ts')
run('grep "ai-chat" /www/zhishuai/server/src/index.ts')

# Check admin-api-providers routes
run('grep -n "router\\.get|router\\.post|router\\.put|router\\.delete" /www/zhishuai/server/src/routes/admin-api-providers.ts | head -10')

# Check admin route registrations
run('grep "admin-api-providers" /www/zhishuai/server/src/index.ts')

# Check which middleware authenticate vs authMiddleware exists
run('ls /www/zhishuai/server/src/middleware/ | sort')
run('grep -l "authenticate" /www/zhishuai/server/src/middleware/*.ts 2>&1')
run('grep "export.*authMiddleware|export.*authenticate" /www/zhishuai/server/src/middleware/auth.ts')

# Test working routes
run('curl -s http://localhost:3001/api/ai-config/keys -H "Authorization: Bearer $(curl -s -X POST http://localhost:3001/api/auth/login -H \'Content-Type: application/json\' -d \'{"phone":"18601655222","password":"123456"}\' | python3 -c \'import sys,json; print(json.load(sys.stdin)["data"]["token"])\')"')

c.close()
print('\n=== DONE ===')
