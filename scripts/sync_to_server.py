import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=60)

def run_cmd(cmd, timeout=120):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    stderr.channel.settimeout(timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(out[:600].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))
    print(f'Exit: {exit_code}')
    return out, err, exit_code

# 1. 上传更新后的schema.prisma
print('\n=== 1. 上传schema.prisma ===')
sftp = c.open_sftp()
sftp.put('c:/Users/Administrator/zhishuai/server/prisma/schema.prisma', '/www/zhishuai/server/prisma/schema.prisma')
sftp.close()

# 2. 在服务器上运行prisma db push（添加AppVersion表）
print('\n=== 2. Prisma db push ===')
run_cmd('cd /www/zhishuai/server && npx prisma db push 2>&1', timeout=60)
run_cmd('cd /www/zhishuai/server && npx prisma generate 2>&1', timeout=60)

# 3. 验证数据库
print('\n=== 3. 验证数据库 ===')
run_cmd("mysql -h 172.19.0.13 -u root -pHao-20061218 -e \"SHOW TABLES LIKE 'AppVersion';\" zhishuai 2>/dev/null")

# 4. PM2保存和最终验证
print('\n=== 4. 最终验证 ===')
run_cmd('pm2 save 2>&1')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -3')

c.close()
