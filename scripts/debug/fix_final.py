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

# 1. 重启 zhishuai-web
print('\n=== 1. 检查和重启 zhishuai-web ===')
run_cmd('pm2 list 2>&1')
# 查看pm2 dump中是否有web
run_cmd('cat /home/ubuntu/.pm2/dump.pm2 | head -5')
# 用ecosystem.config.js重新启动所有服务
run_cmd('cd /www/zhishuai && pm2 start ecosystem.config.js 2>&1', timeout=30)
run_cmd('pm2 list 2>&1')

# 2. 用现有admin账号测试登录
print('\n=== 2. 测试登录 ===')
run_cmd('curl -sk https://api.baizhiji.net/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"phone\":\"18601655222\",\"password\":\"123456\"}" 2>/dev/null')

# 3. 安装EAS CLI with sudo
print('\n=== 3. 安装 EAS CLI ===')
run_cmd('sudo npm install -g eas-cli 2>&1 | tail -10', timeout=120)
run_cmd('eas --version 2>/dev/null || echo eas安装失败')

# 4. 标记Prisma migration为已应用（重命名目录加timestamp）
print('\n=== 4. 修复 Migration 名称 ===')
# 重命名migration目录为符合Prisma格式的名称
run_cmd('cd /www/zhishuai/server/prisma/migrations && mv init_mysql 20240101000000_init_mysql 2>&1')
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied 20240101000000_init_mysql 2>&1')
run_cmd('cd /www/zhishuai/server && npx prisma migrate status 2>&1')

# 5. PM2保存
print('\n=== 5. PM2 save ===')
run_cmd('pm2 save 2>&1')

# 6. 最终验证
print('\n=== 6. 最终验证 ===')
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -3')
run_cmd('curl -sk https://api.baizhiji.net/api/health 2>/dev/null')
run_cmd('pm2 list 2>&1')

c.close()
