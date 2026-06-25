#!/usr/bin/env python3
"""
Step 3: 在服务器上重新构建并重启服务
"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOST = "150.109.60.130"
PORT = 22
USER = "ubuntu"
PASSWORD = "Hao20061218"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=180):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out)
    if err:
        print(f"[STDERR] {err}")
    return out, err

print("=" * 60)
print("Step 3: 重新构建服务...")
print("=" * 60)

# 构建 Server
print("\n--- 构建 Server ---")
run("cd /var/www/zhishuai/server && npm run build 2>&1")

# 构建 Web
print("\n--- 构建 Web ---")
run("cd /var/www/zhishuai/web && npm run build 2>&1")

# 重启 PM2 服务
print("\n--- 重启 zhishuai-api ---")
run("pm2 restart zhishuai-api 2>&1")

print("\n--- 重启 zhishuai-web ---")
run("pm2 restart zhishuai-web 2>&1")

# 等待服务启动
import time
print("\n--- 等待服务启动 (5秒) ---")
time.sleep(5)

# 检查状态
print("\n--- PM2 状态 ---")
out, err = run("pm2 list 2>&1")

# 测试 API
print("\n--- 测试 API ---")
out, err = run("curl -s http://localhost:3001/api/health 2>&1 || echo 'API not reachable'")

ssh.close()
print("\n" + "=" * 60)
print("部署完成！")
print("=" * 60)
