#!/usr/bin/env python3
"""检查 PM2 进程并重启服务"""
import paramiko
import time
import sys

# 设置 stdout 编码
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=30)

def run(cmd, timeout=15):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace')

# 查看 pm2 jlist 获取进程名
out = run("sudo pm2 jlist 2>&1")
import json
try:
    processes = json.loads(out)
    for p in processes:
        name = p.get('name', 'unknown')
        pid = p.get('pid', 0)
        status = p.get('pm2_env', {}).get('status', 'unknown')
        script = p.get('pm2_env', {}).get('pm_exec_path', 'unknown')
        print(f"  {name} - pid:{pid} - status:{status} - script:{script}")
except:
    print("PM2 进程解析失败，查看原始输出...")
    print(out[:500])

# 重启所有
print("\n重启所有 PM2 进程...")
out = run("sudo pm2 restart all 2>&1")
print(out[:300])

time.sleep(8)

# 验证
print("\nAPI 健康检查:")
out = run("curl -s http://localhost:3001/api/health 2>&1")
print(out[:300])

print("\n前端检查:")
out = run("curl -sI http://localhost:3000 2>&1 | head -5")
print(out[:300])

client.close()
print("\n完成!")
