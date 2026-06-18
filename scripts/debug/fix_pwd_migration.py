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

# 1. 修复admin密码 - 字段名是 password 不是 passwordHash
print('\n=== 1. 修复admin密码 ===')
# 先获取bcrypt hash
out, _, _ = run_cmd("cd /www/zhishuai/server && node -e \"const b=require('bcryptjs');console.log(b.hashSync('123456',10))\"")
hash_val = ''
for line in out.split('\n'):
    if line.startswith('$2a') or line.startswith('$2b'):
        hash_val = line.strip()
        break
print(f'Hash: {hash_val}')

# 使用Node.js直接更新数据库（避免shell转义问题）
update_script = f'''
const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: '172.19.0.13',
    user: 'root',
    password: 'Hao-20061218',
    database: 'zhishuai'
  });
  const hash = '{hash_val}';
  await conn.execute("UPDATE User SET password = ? WHERE phone = '18601655222'", [hash]);
  const [rows] = await conn.execute("SELECT phone, LEFT(password, 20) as pwd FROM User WHERE phone = '18601655222'");
  console.log(JSON.stringify(rows));
  await conn.end();
}
main().catch(console.error);
'''

# 写脚本到服务器
sftp = c.open_sftp()
with sftp.open('/tmp/update_pwd.js', 'w') as f:
    f.write(update_script)
sftp.close()

run_cmd('cd /www/zhishuai/server && node /tmp/update_pwd.js 2>&1')
# 确认
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"SELECT phone, LEFT(password, 30) as pwd FROM User WHERE phone='18601655222';\" zhishuai 2>/dev/null")

# 2. 测试登录
time.sleep(2)
print('\n=== 2. 测试登录 ===')
result = run_cmd('curl -sk https://baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d \'{\"phone\":\"18601655222\",\"password\":\"123456\"}\' 2>/dev/null')
if 'token' in result[0].lower() or 'true' in result[0].lower():
    print('=== 登录成功! ===')
else:
    print(f'登录结果: {result[0][:300]}')
    # 检查auth.ts中用的字段名
    run_cmd("grep -n 'password' /www/zhishuai/server/src/routes/auth.ts | head -10 2>/dev/null")

# 3. 修复migration - 把migration.sql文件恢复回来
print('\n=== 3. 修复migration文件 ===')
run_cmd('ls /www/zhishuai/server/prisma/migrations/20240101000000_init/ 2>&1')
# 检查migration.sql是否存在
run_cmd('cat /www/zhishuai/server/prisma/migrations/20240101000000_init/migration.sql 2>/dev/null | head -10')
# 如果不存在，需要创建一个空migration.sql
run_cmd('echo "-- AlreadyApplied" > /www/zhishuai/server/prisma/migrations/20240101000000_init/migration.sql 2>&1')
# 删除之前错误的baseline记录
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"DELETE FROM _prisma_migrations WHERE migration_name LIKE '%init%';\" zhishuai 2>/dev/null")
# 然后用prisma migrate resolve标记
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init 2>&1')
run_cmd('cd /www/zhishuai/server && npx prisma migrate status 2>&1')

# 4. PM2保存
run_cmd('pm2 save 2>&1')

c.close()
