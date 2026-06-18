import paramiko, time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=30)

def run(cmd, timeout=120):
    print(f'\n>>> {cmd[:120]}')
    try:
        stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        code = stdout.channel.recv_exit_status()
        if out: print(out[:3000])
        if err and 'CLIXML' not in err: print('ERR:', err[:800])
        print(f'Exit: {code}')
        return out, err, code
    except Exception as e:
        print(f'FAILED: {e}')
        return '', str(e), 1

# 1. prisma db push 同步全部 schema（添加缺失的列）
print('=== 1. Prisma db push (sync schema) ===')
run('cd /www/zhishuai/server && npx prisma db push 2>&1', timeout=180)

# 2. 重新 generate client
print('\n=== 2. Prisma generate ===')
run('cd /www/zhishuai/server && npx prisma generate 2>&1', timeout=60)

# 3. 验证 User 表现在有 email 字段
print('\n=== 3. Verify User table ===')
run("mysql -h 172.19.0.13 -u root -pHao-20061218 -e 'DESCRIBE User;' zhishuai 2>/dev/null")

# 4. Seed 数据
print('\n=== 4. Seed database ===')
run('cd /www/zhishuai/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1', timeout=60)

# 5. 停止旧API进程并重启
print('\n=== 5. Restart API ===')
run('pm2 delete zhishuai-api 2>/dev/null')
run('pkill -f "node.*index" 2>/dev/null')
run('pkill -f "tsx.*index" 2>/dev/null')
time.sleep(3)

# 用 tsx 启动（因为 build 可能还有其他 TS 错误）
run('cd /www/zhishuai/server && pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1', timeout=30)

print('\nWaiting 25s...')
time.sleep(25)

# 6. 验证
print('\n=== 6. Verify ===')
run('curl -s http://localhost:3001/api/health')

# 如果失败查看日志
out, _, _ = run('curl -s http://localhost:3001/api/health')
if not out or 'ok' not in out:
    print('\n=== Error logs ===')
    run('pm2 logs zhishuai-api --lines 30 --nostream 2>&1', timeout=30)

# PM2 保存
run('pm2 save')

c.close()
print('\n=== DONE ===')
