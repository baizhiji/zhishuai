#!/usr/bin/env python3
"""在服务器上重新构建并启动Web前端"""
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

# ===== Step 1: Check current .next directory =====
print("\n[2] 检查当前.next目录内容...")
out, err = run("ls -la /var/www/zhishuai/web/.next/ 2>&1")
print(out)

# Check if BUILD_ID exists
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
print(f"  BUILD_ID: {out.strip()}")

# ===== Step 2: Delete old .next and rebuild =====
print("\n[3] 清除旧构建产物并重新构建...")
out, err = run("rm -rf /var/www/zhishuai/web/.next 2>&1")
print(f"  清除旧.next: {out.strip() or 'OK'}")

# Check node version
out, err = run("node -v 2>&1")
print(f"  Node版本: {out.strip()}")

# Check npm version
out, err = run("npm -v 2>&1")
print(f"  npm版本: {out.strip()}")

# ===== Step 3: Run next build =====
print("\n[4] 执行 npm run build (可能需要2-3分钟)...")
out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)
print(out[-3000:])
if err:
    print(f"  stderr: {err[-1000:]}")

# ===== Step 4: Verify build output =====
print("\n[5] 验证构建产物...")
out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
print(f"  BUILD_ID: {out.strip()}")

out, err = run("ls /var/www/zhishuai/web/.next/server/app/ 2>&1 | head -10")
print(f"  server/app内容: {out.strip()}")

# ===== Step 5: Restart web service =====
print("\n[6] 重启Web服务...")
out, err = run("pm2 delete zhishuai-web 2>/dev/null; echo DONE")
print(f"  旧进程删除: {out.strip()}")

out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
print(f"  启动结果: {out[-500:]}")

run("pm2 save 2>/dev/null")
print("  PM2配置已保存")

# ===== Step 6: Wait and verify =====
print("\n[7] 等待服务启动 (15秒)...")
time.sleep(15)

out, err = run("pm2 status 2>&1")
print(out)

# Check localhost:3000
out, err = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
print(f"  Web HTTP状态码: {out.strip()}")

# Check domain
out, err = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
print(f"  域名HTTPS状态码: {out.strip()}")

# Check web error logs
out, err = run("pm2 logs zhishuai-web --lines 10 --nostream 2>&1")
print(f"  最近日志:\n{out[-1000:]}")

client.close()
print("\n修复完成!")
