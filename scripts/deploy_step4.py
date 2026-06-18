import paramiko, time, sys

# 修复编码问题
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

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
        # 替换 emoji 避免 GBK 编码错误
        safe_out = out.encode('ascii', 'replace').decode('ascii')
        safe_err = err.encode('ascii', 'replace').decode('ascii')
        if safe_out: print(safe_out[:3000])
        if safe_err and 'CLIXML' not in safe_err: print('ERR:', safe_err[:800])
        print(f'Exit: {code}')
        return out, err, code
    except Exception as e:
        print(f'FAILED: {e}')
        return '', str(e), 1

# 1. 停止所有 API 进程
print('=== 1. Stop all API processes ===')
run('pm2 delete zhishuai-api 2>/dev/null; pkill -f "node.*index" 2>/dev/null; pkill -f "tsx.*index" 2>/dev/null; sleep 2')

# 2. 确认 prisma db push 已完成
print('\n=== 2. Verify db schema is synced ===')
run("mysql -h 172.19.0.13 -u root -pHao-20061218 -e 'DESCRIBE User;' zhishuai 2>/dev/null")

# 3. Seed 数据
print('\n=== 3. Seed database ===')
run('cd /www/zhishuai/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1', timeout=60)

# 4. 启动 API (用 tsx)
print('\n=== 4. Start API with tsx ===')
run('cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1', timeout=30)

print('\nWaiting 30s...')
time.sleep(30)

# 5. 验证
print('\n=== 5. Verify API ===')
out, _, _ = run('curl -s http://localhost:3001/api/health')
if out and 'ok' in out:
    print('\n*** API is running! ***')
else:
    print('\n*** API not running, checking logs ***')
    run('pm2 logs zhishuai-api --lines 40 --nostream 2>&1', timeout=30)

# 6. Web 健康检查
print('\n=== 6. Verify Web ===')
run('curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000')

# 7. PM2 保存
run('pm2 save 2>&1')

# 8. HTTPS 验证
print('\n=== 7. HTTPS check ===')
run('curl -sk https://baizhiji.net/api/health 2>/dev/null || echo "HTTPS check skipped"')

c.close()
print('\n=== ALL DONE ===')
