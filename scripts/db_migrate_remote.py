#!/usr/bin/env python3
"""
Step 2: 在服务器上执行数据库迁移并重新部署
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

def run(cmd, timeout=120):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out)
    if err:
        print(f"[STDERR] {err}")
    return out, err

# Step 1: 数据库迁移 - 使用 prisma db push
print("=" * 60)
print("Step 2: 数据库迁移...")
print("=" * 60)

# 先检查 prisma 是否可用
run("cd /var/www/zhishuai/server && npx prisma --version 2>&1")

# 生成 Prisma Client
print("\n--- 生成 Prisma Client ---")
run("cd /var/www/zhishuai/server && npx prisma generate 2>&1")

# 推送 schema 到数据库
print("\n--- 推送 Schema 到数据库 ---")
out, err = run("cd /var/www/zhishuai/server && npx prisma db push --accept-data-loss 2>&1")

# 验证 LoginLog 表
print("\n--- 验证 LoginLog 表 ---")
out, err = run("mysql -h 172.19.0.13 -P 3306 -u root -pHao-20061218 -e \"USE zhishuai; DESC LoginLog;\" 2>&1")
print(out)

# 验证 ScheduledTask 新字段
print("\n--- 验证 ScheduledTask 字段 ---")
out, err = run("mysql -h 172.19.0.13 -P 3306 -u root -pHao-20061218 -e \"USE zhishuai; DESC ScheduledTask;\" 2>&1")
print(out)

ssh.close()
