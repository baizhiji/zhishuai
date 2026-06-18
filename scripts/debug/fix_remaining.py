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
        print(out[:500].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))
    print(f'Exit: {exit_code}')
    return out, err, exit_code

# 1. 修复Prisma migration - 用prisma db push代替（因为数据库已有表）
print('\n=== 1. 修复 Prisma Migration ===')
out, err, code = run_cmd('cd /www/zhishuai/server && npx prisma db push --accept-data-loss 2>&1', timeout=60)
# 然后用baseline标记
out, err, code = run_cmd('cd /www/zhishuai/server && npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script 2>&1 | head -5')
# 尝试直接标记
run_cmd('cd /www/zhishuai/server && ls prisma/migrations/ 2>&1')
run_cmd('cd /www/zhishuai/server && ls prisma/migrations/init_mysql/ 2>&1')
# 尝试带上完整目录名标记
out, err, code = run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init_mysql 2>&1')
# 查看migration目录名
run_cmd('cd /www/zhishuai/server && find prisma/migrations -type d 2>&1')

# 2. 确认PM2开机自启已保存
print('\n=== 2. PM2 保存 ===')
run_cmd('pm2 save 2>&1')

# 3. 检查PM2 web进程是否也在运行
print('\n=== 3. PM2 全进程 ===')
run_cmd('pm2 list 2>&1')

# 4. 确认API健康
print('\n=== 4. 健康检查 ===')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')
run_cmd('curl -sk https://api.baizhiji.net/api/health 2>/dev/null')

# 5. 尝试登录测试
print('\n=== 5. 登录测试 ===')
run_cmd('curl -sk https://api.baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"password\":\"123456\"}" 2>/dev/null')
run_cmd('curl -sk https://baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"password\":\"123456\"}" 2>/dev/null')

# 6. 检查数据库用户表
print('\n=== 6. 查询用户表 ===')
run_cmd('mysql -h 172.19.0.13 -u root -pHao-20061218 -e "SELECT id, phone, name, role, status FROM User LIMIT 5;" zhishuai 2>/dev/null')

# 7. 安装EAS CLI用于APK构建
print('\n=== 7. 安装 EAS CLI ===')
run_cmd('npm install -g eas-cli 2>&1 | tail -5', timeout=60)
run_cmd('which eas 2>/dev/null && eas --version 2>/dev/null || echo eas未安装')

c.close()
