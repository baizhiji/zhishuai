#!/usr/bin/env python3
"""重启前端服务"""
import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=30)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace')

# 查找 web 进程
out = run("ps aux | grep 'next' | grep -v grep | head -5")
print(f"Web 进程:\n{out}")

# 重启 web 进程
print("\n重启 Web 服务...")
out = run("sudo kill $(pgrep -f 'next start') 2>&1; sleep 2; cd /var/www/zhishuai/web && sudo -b nohup npm run start > /var/log/zhishuai/web-out.log 2>&1 &")
print(f"重启结果: {out[:200]}")

time.sleep(8)

# 验证
out = run("curl -sI http://localhost:3000 | head -3")
print(f"\n前端状态:\n{out[:200]}")

out = run("curl -s http://localhost:3001/api/health")
print(f"\nAPI状态:\n{out[:200]}")

client.close()
print("\n完成!")
