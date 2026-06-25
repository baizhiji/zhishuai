#!/usr/bin/env python3
"""
SSH 连接到 zhishuai-server CVM，检查部署状态并执行数据库迁移
"""
import paramiko
import sys
import os

HOST = "150.109.60.130"
PORT = 22
USER = "ubuntu"
PASSWORD = "Hao20061218"

def ssh_exec(ssh, cmd, timeout=60):
    """执行远程命令并返回输出"""
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print(out)
    if err:
        print(f"[STDERR] {err}")
    return out, err

def main():
    print("=" * 60)
    print("连接 zhishuai-server (150.109.60.130)...")
    print("=" * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        print("SSH 连接成功！")
        
        # 1. 检查基本环境
        ssh_exec(ssh, "whoami && pwd && uptime")
        ssh_exec(ssh, "ls -la /home/ubuntu/")
        
        # 2. 检查项目是否存在
        ssh_exec(ssh, "ls -la /home/ubuntu/zhishuai/ 2>&1 | head -20")
        
        # 3. 检查 Node.js / npm / prisma
        ssh_exec(ssh, "node --version 2>&1; npm --version 2>&1; which npx 2>&1")
        
        # 4. 检查 PM2 状态
        ssh_exec(ssh, "pm2 list 2>&1 || echo 'PM2 未运行'")
        
        # 5. 检查 Docker 状态
        ssh_exec(ssh, "docker ps 2>&1 || echo 'Docker 未运行'")
        
        # 6. 检查项目路径
        out, _ = ssh_exec(ssh, "find /home/ubuntu/ -maxdepth 3 -name 'prisma' -type d 2>/dev/null")
        
        print("\n" + "=" * 60)
        print("检查完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"SSH 连接失败: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
