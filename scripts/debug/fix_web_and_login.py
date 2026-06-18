import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run_cmd(cmd, timeout=30):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(out[:600].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))
    print(f'Exit: {exit_code}')
    return out, err, exit_code

# 1. 检查zhishuai-web是否在PM2中
print('\n=== 1. 检查zhishuai-web ===')
run_cmd('pm2 list 2>&1')
run_cmd('pm2 logs zhishu-web --lines 10 --nostream 2>&1')
# 尝试手动启动web
run_cmd('cd /www/zhishuai/web && pm2 start "npm run start" --name zhishuai-web 2>&1')
time.sleep(5)
run_cmd('pm2 list 2>&1')

# 2. 检查web端口3000是否在监听
run_cmd('ss -tlnp 2>/dev/null | grep 3000 || echo 3000端口未监听')
run_cmd('ss -tlnp 2>/dev/null | grep 3001 || echo 3001端口未监听')

# 3. 验证web是否直接访问OK
run_cmd('curl -s http://localhost:3000 2>/dev/null | head -5')

# 4. 修复admin密码（使用bcryptjs在服务器端生成新hash）
print('\n=== 4. 修复admin密码 ===')
# 在服务器上用node生成bcrypt hash for 123456
run_cmd('cd /www/zhishuai/server && node -e "const bcrypt = require(\"bcryptjs\"); const hash = bcrypt.hashSync(\"123456\", 10); console.log(hash);" 2>&1')
# 获取hash后更新数据库

# 5. 查看PM2详细日志
print('\n=== 5. PM2日志 ===')
run_cmd('pm2 logs --lines 15 --nostream 2>&1')

# 6. 标记prisma migration baseline
print('\n=== 6. Prisma baseline ===')
# 先看migration目录名格式是否正确
run_cmd('ls /www/zhishuai/server/prisma/migrations/ 2>&1')
# 尝试prisma migrate deploy
run_cmd('cd /www/zhishuai/server && npx prisma migrate deploy 2>&1', timeout=30)

c.close()
