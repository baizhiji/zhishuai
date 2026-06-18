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

# 1. 配置PM2开机自启
print('\n=== 1. PM2 开机自启 ===')
out, err, code = run_cmd('sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1')
# 保存当前PM2进程列表
out, err, code = run_cmd('pm2 save 2>&1')
# 检查systemd是否启用
out, err, code = run_cmd('systemctl is-enabled pm2-ubuntu 2>/dev/null || echo not-enabled')

# 2. 修复JWT_SECRET - 生成强密钥
print('\n=== 2. 修复 JWT_SECRET ===')
import secrets
new_jwt_secret = secrets.token_urlsafe(48)
print(f'新JWT密钥: {new_jwt_secret[:10]}...')

# 更新server/.env中的JWT_SECRET
run_cmd(f"sed -i 's/JWT_SECRET=zhishuai-secret-key-2024/JWT_SECRET={new_jwt_secret}/' /www/zhishuai/server/.env")
# 确认更新
run_cmd('grep JWT_SECRET /www/zhishuai/server/.env')

# 3. 标记Prisma Migration为已应用（因为数据库已有表）
print('\n=== 3. 修复 Prisma Migration ===')
run_cmd('cd /www/zhishuai/server && npx prisma migrate resolve --applied init_mysql 2>&1')
# 确认状态
run_cmd('cd /www/zhishuai/server && npx prisma migrate status 2>&1')

# 4. 重新构建并重启API服务
print('\n=== 4. 重启 API 服务 ===')
run_cmd('cd /www/zhishuai/server && npm run build 2>&1', timeout=60)
run_cmd('cd /www/zhishuai && pm2 restart zhishuai-api 2>&1')
# 等一下再检查
time.sleep(3)
run_cmd('curl -sk https://api.baizhiji.net/api/health 2>/dev/null')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')

# 5. 创建uploads目录
print('\n=== 5. 创建 uploads 目录 ===')
run_cmd('mkdir -p /www/zhishuai/server/uploads && chmod 777 /www/zhishuai/server/uploads')
run_cmd('mkdir -p /www/zhishuai/uploads && chmod 777 /www/zhishuai/uploads')
run_cmd('ls -la /www/zhishuai/server/uploads')

# 6. 确认nginx配置正常
print('\n=== 6. 验证 nginx ===')
run_cmd('sudo nginx -t 2>&1')
run_cmd('sudo systemctl status nginx | head -5 2>&1')

# 7. 检查PM2进程状态
print('\n=== 7. PM2 进程状态 ===')
run_cmd('pm2 list 2>&1')

# 8. 验证HTTPS正常
print('\n=== 8. 验证 HTTPS ===')
run_cmd('curl -sk https://baizhiji.net 2>/dev/null | head -5')
run_cmd('curl -sk https://api.baizhiji.net/api/health 2>/dev/null')

print('\n=== 修复完成 ===')
c.close()
