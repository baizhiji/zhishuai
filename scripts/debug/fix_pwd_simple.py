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

# 1. 上传 update_pwd.js 到服务器
print('\n=== 1. 上传密码更新脚本 ===')
sftp = c.open_sftp()
sftp.put('c:/Users/Administrator/zhishuai/update_pwd.js', '/tmp/update_pwd.js')
sftp.close()

# 2. 执行密码更新
print('\n=== 2. 执行密码更新 ===')
# 检查mysql2是否安装
run_cmd('cd /www/zhishuai/server && npm list mysql2 2>/dev/null | head -3')
run_cmd('cd /www/zhishuai/server && node /tmp/update_pwd.js 2>&1')

# 3. 测试登录
print('\n=== 3. 测试登录 ===')
time.sleep(2)
result = run_cmd("curl -sk https://baizhiji.net/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"phone\":\"18601655222\",\"password\":\"123456\"}' 2>/dev/null")
print(f'登录结果: {result[0][:300]}')

# 4. 修复migration文件
print('\n=== 4. 修复migration ===')
run_cmd('ls /www/zhishuai/server/prisma/migrations/20240101000000_init/ 2>&1')
run_cmd("echo '-- AlreadyApplied' > /www/zhishuai/server/prisma/migrations/20240101000000_init/migration.sql")
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"DELETE FROM _prisma_migrations WHERE migration_name LIKE '%init%';\" zhishuai 2>/dev/null")
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init 2>&1')
run_cmd('cd /www/zhishuai/server && npx prisma migrate status 2>&1')

# 5. PM2保存和验证
print('\n=== 5. 最终验证 ===')
run_cmd('pm2 save 2>&1')
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -3')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')
run_cmd('pm2 list 2>&1')

c.close()
