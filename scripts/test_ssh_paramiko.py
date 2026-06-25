#!/usr/bin/env python3
"""测试 SSH 连接"""
import paramiko
import sys

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"连接 {USER}@{HOST}...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=30)
    print("连接成功!")
    
    stdin, stdout, stderr = client.exec_command("echo hello && pm2 status", timeout=15)
    print("输出:", stdout.read().decode('utf-8', errors='replace')[:500])
    print("错误:", stderr.read().decode('utf-8', errors='replace')[:200])
    
    client.close()
except Exception as e:
    print(f"连接失败: {e}")
    sys.exit(1)
