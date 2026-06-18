import paramiko
import time
import subprocess

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

# 1. 等待zhishuai-web启动
print('\n=== 1. 等待web启动 ===')
time.sleep(10)
run_cmd('pm2 list 2>&1')
run_cmd('ss -tlnp 2>/dev/null | grep 3000')
run_cmd('pm2 logs zhishuai-web --lines 5 --nostream 2>&1')

# 2. 修复admin密码 - 用Python脚本来避免shell转义问题
print('\n=== 2. 修复admin密码 ===')
# 先生成hash
out, _, _ = run_cmd("cd /www/zhishuai/server && node -e \"const b=require('bcryptjs');console.log(b.hashSync('123456',10))\"")
# 提取hash
hash_val = ''
for line in out.split('\n'):
    if line.startswith('$2a') or line.startswith('$2b'):
        hash_val = line.strip()
        break
print(f'Hash: {hash_val}')

if hash_val:
    # 使用单引号包裹避免shell解析$
    sql = f"UPDATE User SET passwordHash='{hash_val}' WHERE phone='18601655222';"
    # 写到一个临时文件避免shell转义
    run_cmd(f"echo \"{sql}\" > /tmp/update_pwd.sql")
    run_cmd(f"mysql -h 172.19.0.13 -u root -pHao-20061218 zhishuai < /tmp/update_pwd.sql 2>/dev/null")
    # 查询确认
    run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"SELECT phone, LEFT(passwordHash, 20) as pwd_prefix FROM User WHERE phone='18601655222';\" zhishuai 2>/dev/null")

# 3. 测试登录
time.sleep(2)
print('\n=== 3. 测试登录 ===')
result = run_cmd('curl -sk https://baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d \'{\"phone\":\"18601655222\",\"password\":\"123456\"}\' 2>/dev/null')
# 检查是否成功
if 'token' in result[0].lower() or 'success' in result[0].lower():
    print('登录成功!')
else:
    print(f'登录失败: {result[0][:200]}')
    # 查看User表的password字段名
    run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"DESCRIBE User;\" zhishuai 2>/dev/null | head -20")

# 4. 验证网站
print('\n=== 4. 验证网站 ===')
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -5')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')

# 5. 修复Prisma migration - 先重命名再标记
print('\n=== 5. Prisma migration baseline ===')
# Prisma需要timestamp格式的目录名
run_cmd('cd /www/zhishuai/server/prisma/migrations && ls 2>&1')
# 用正确的timestamp格式（14位）
run_cmd('cd /www/zhishuai/server/prisma/migrations && mv 20240101000000_init_mysql 20240101000000_init 2>/dev/null; ls 2>&1')
# 尝试resolve
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init 2>&1')
# 如果不行，直接在数据库中插入记录
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"CREATE TABLE IF NOT EXISTS _prisma_migrations (id VARCHAR(36) NOT NULL PRIMARY KEY, checksum VARCHAR(64) NOT NULL, finished_at DATETIME, migration_name VARCHAR(255) NOT NULL, logs TEXT, rolled_back_at DATETIME, started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, applied_steps_count INTEGER NOT NULL DEFAULT 0);\" zhishuai 2>/dev/null")
# 插入一条记录标记migration已应用
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"INSERT IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ('baseline', 'baseline', NOW(), '20240101000000_init', NOW(), 1);\" zhishuai 2>/dev/null")
run_cmd('cd /www/zhishuai/server && npx prisma migrate status 2>&1')

c.close()
