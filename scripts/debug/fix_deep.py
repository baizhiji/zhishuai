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

# 1. 清理PM2并重建
print('\n=== 1. 清理PM2 ===')
run_cmd('pm2 delete all 2>&1')
# kill掉旧的web进程
run_cmd('sudo kill 2304402 2>&1 || echo old web PID already dead')
time.sleep(2)

# 2. 用ecosystem.config.js正确启动
print('\n=== 2. 用ecosystem.config.js启动 ===')
run_cmd('cat /www/zhishuai/ecosystem.config.js 2>&1')
# 直接用正确方式启动web（next start）
run_cmd('cd /www/zhishuai/web && pm2 start "npx next start -H 0.0.0.0 -p 3000" --name zhishuai-web 2>&1')
# 用正确方式启动api
run_cmd('cd /www/zhishuai/server && pm2 start dist/index.js --name zhishuai-api -i 2 2>&1')
time.sleep(5)
run_cmd('pm2 list 2>&1')

# 3. 验证端口
run_cmd('ss -tlnp 2>/dev/null | grep -E "3000|3001"')

# 4. 验证网站访问
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -3')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')

# 5. 修复Prisma migration baseline
print('\n=== 5. Prisma baseline ===')
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init_mysql 2>&1')

# 6. 重置admin密码为123456
print('\n=== 6. 重置admin密码 ===')
# 用node在server目录下执行bcrypt
result = run_cmd('cd /www/zhishuai/server && node -e "const b=require(\'bcryptjs\');console.log(b.hashSync(\'123456\',10))" 2>&1')
# 提取hash
hash_line = ''
for line in result[0].split('\n'):
    if line.startswith('$2'):
        hash_line = line
        break
print(f'bcrypt hash: {hash_line}')

if hash_line:
    # 更新数据库中的admin密码
    run_cmd(f'mysql -h 172.19.0.13 -u root -pHao-20061218 -e "UPDATE User SET passwordHash=\'{hash_line}\' WHERE phone=\'18601655222\';" zhishuai 2>/dev/null')
    # 确认更新
    run_cmd('mysql -h 172.19.0.13 -u root -pHao-20061218 -e "SELECT phone, passwordHash FROM User WHERE phone=\'18601655222\';" zhishuai 2>/dev/null')

# 7. 测试登录
print('\n=== 7. 测试登录 ===')
run_cmd('curl -sk https://baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"123456\"}" 2>/dev/null')

# 8. PM2保存
run_cmd('pm2 save 2>&1')

c.close()
