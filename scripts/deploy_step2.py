import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=30)

def run(cmd, timeout=60):
    print(f'\n>>> {cmd[:100]}')
    try:
        stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        code = stdout.channel.recv_exit_status()
        if out: print(out[:2000])
        if err and 'CLIXML' not in err: print('ERR:', err[:600])
        print(f'Exit: {code}')
        return out, err, code
    except Exception as e:
        print(f'FAILED: {e}')
        return '', str(e), 1

# 1. 检查 User 表结构
print('=== User table structure ===')
run("mysql -h 172.19.0.13 -u root -pHao-20061218 -e 'DESCRIBE User;' zhishuai 2>/dev/null")

# 2. 检查表数量
print('\n=== Table count ===')
run("mysql -h 172.19.0.13 -u root -pHao-20061218 -e 'SHOW TABLES;' zhishuai 2>/dev/null")

# 3. 创建日志目录
run('sudo mkdir -p /var/log/zhishuai')
run('sudo chown ubuntu:ubuntu /var/log/zhishuai')

# 4. 停止旧 API
run('pm2 delete zhishuai-api 2>/dev/null')
run('pkill -f "tsx.*index" 2>/dev/null')

# 5. 用 tsx 启动 API
print('\n=== Starting API with tsx ===')
run('cd /www/zhishuai/server && pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1', timeout=30)

print('\nWaiting 25s for startup...')
time.sleep(25)

# 6. 验证 API
print('\n=== API health check ===')
run('curl -s http://localhost:3001/api/health')

# 7. PM2 状态
print('\n=== PM2 status ===')
run('pm2 list')

# 8. 如果 API 未启动，查看错误日志
out, _, _ = run('curl -s http://localhost:3001/api/health')
if not out or 'ok' not in out:
    print('\n=== API error logs ===')
    run('pm2 logs zhishuai-api --lines 50 --nostream 2>&1', timeout=30)

# 9. Seed 数据（如果 User 表为空）
print('\n=== Check existing users ===')
run("mysql -h 172.19.0.13 -u root -pHao-20061218 -e 'SELECT COUNT(*) as cnt FROM User;' zhishuai 2>/dev/null")

# 10. Seed
run('cd /www/zhishuai/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1', timeout=60)

# 11. 保存 PM2
run('pm2 save')

c.close()
print('\n=== ALL DONE ===')
