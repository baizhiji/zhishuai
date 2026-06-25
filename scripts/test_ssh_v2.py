#!/usr/bin/env python3
"""测试 SSH 连接 - 详细错误"""
import traceback

try:
    import paramiko
    print("paramiko 已安装")
except ImportError:
    print("paramiko 未安装!")
    import subprocess
    subprocess.run(["pip", "install", "paramiko"], check=True)
    import paramiko
    print("paramiko 已安装")

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"正在连接 {USER}@{HOST}:22...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=30)
    print("SSH 连接成功!")
    
    stdin, stdout, stderr = client.exec_command("echo hello", timeout=10)
    out = stdout.read().decode('utf-8', errors='replace')
    print(f"命令输出: {out}")
    
    client.close()
except Exception as e:
    print(f"连接失败: {type(e).__name__}: {e}")
    traceback.print_exc()
