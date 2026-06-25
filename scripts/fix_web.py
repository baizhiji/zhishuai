#!/usr/bin/env python3
"""修复Web前端服务：检查状态、重启、验证"""
import paramiko, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("[1] 连接服务器...")
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print("  连接成功!")

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    return out, err

# ===== Step 1: Check current PM2 status =====
print("\n[2] 检查PM2当前状态...")
out, err = run("pm2 status 2>&1")
print(out)

# ===== Step 2: Check web error logs =====
print("\n[3] 检查Web最近错误日志...")
out, err = run("pm2 logs zhishuai-web --lines 30 --nostream 2>&1")
print(out[-2000:])

# ===== Step 3: Check if .next build exists =====
print("\n[4] 检查Next.js构建产物...")
out, err = run("ls -la /var/www/zhishuai/web/.next/ 2>&1 | head -5")
print(out)

# ===== Step 4: Check web node_modules =====
print("\n[5] 检查Web node_modules...")
out, err = run("ls /var/www/zhishuai/web/node_modules/.bin/next 2>&1")
print(out)

# ===== Step 5: Restart web service =====
print("\n[6] 重启Web前端服务...")

# Stop and delete the old process
out, err = run("pm2 delete zhishuai-web 2>/dev/null; echo DELETE_DONE")
print(f"  旧进程删除: {out.strip()}")

# Check if ecosystem.config.cjs exists
out, err = run("cat /var/www/zhishuai/web/ecosystem.config.cjs 2>&1")
if 'zhishuai-web' in out:
    print("  ecosystem.config.cjs 存在，使用它启动")
    out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
else:
    print("  ecosystem.config.cjs 不存在，直接启动next")
    out, err = run("cd /var/www/zhishuai/web && pm2 start './node_modules/.bin/next' --name zhishuai-web -- start -p 3000 2>&1")
print(f"  启动结果: {out[-500:]}")

# ===== Step 6: Save PM2 =====
run("pm2 save 2>/dev/null")
print("  PM2配置已保存")

# ===== Step 7: Wait and verify =====
print("\n[7] 等待服务启动 (10秒)...")
time.sleep(10)

out, err = run("pm2 status 2>&1")
print(out)

# Check localhost:3000
out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
print(f"  Web HTTP状态码: {out.strip()}")

# Check domain access
out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
print(f"  域名HTTPS状态码: {out.strip()}")

# Check API still works
out, err = run("curl -s http://localhost:3001/api/health 2>&1")
print(f"  API健康检查: {out.strip()[:200]}")

client.close()

print("\n修复流程完成!")
