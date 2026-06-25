#!/usr/bin/env python3
"""
将本地改动同步到 CVM 服务器，执行数据库迁移，并重新部署
"""
import paramiko
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOST = "150.109.60.130"
PORT = 22
USER = "ubuntu"
PASSWORD = "Hao20061218"

# 需要同步的关键文件列表（相对于项目根目录）
FILES_TO_SYNC = [
    # Schema
    "server/prisma/schema.prisma",
    # Server source files
    "server/src/middleware/auth.ts",
    "server/src/routes/auth.ts",
    "server/src/routes/account.ts",
    "server/src/routes/publish.ts",
    "server/src/services/scheduler.ts",
    # Web source files
    "web/app/customer/page.tsx",
    "web/components/layout/Navbar.tsx",
    # Scripts
    "scripts/final_verify.py",
]

LOCAL_BASE = r"c:\Users\Administrator\zhishuai"
REMOTE_BASE = "/var/www/zhishuai"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

# Step 1: Upload files via SFTP
print("=" * 60)
print("Step 1: 上传改动文件到服务器...")
print("=" * 60)

sftp = ssh.open_sftp()

for f in FILES_TO_SYNC:
    local_path = os.path.join(LOCAL_BASE, f)
    remote_path = os.path.join(REMOTE_BASE, f).replace("\\", "/")
    
    if not os.path.exists(local_path):
        print(f"  [SKIP] 本地文件不存在: {local_path}")
        continue
    
    # Ensure remote directory exists
    remote_dir = os.path.dirname(remote_path).replace("\\", "/")
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        # Create directories recursively
        parts = remote_dir.split("/")
        for i in range(2, len(parts) + 1):
            partial = "/".join(parts[:i])
            try:
                sftp.stat(partial)
            except FileNotFoundError:
                sftp.mkdir(partial)
    
    sftp.put(local_path, remote_path)
    print(f"  [OK] {f}")

sftp.close()

# Also upload the web Navbar component - need to find correct path
# The server shows: web/app/customer/layout/Navbar.tsx
print("\n  Also uploading web Navbar...")
sftp = ssh.open_sftp()
local_navbar = r"c:\Users\Administrator\zhishuai\web\components\layout\Navbar.tsx"
remote_navbar = "/var/www/zhishuai/web/components/layout/Navbar.tsx"
if os.path.exists(local_navbar):
    remote_dir = "/var/www/zhishuai/web/components/layout"
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    sftp.put(local_navbar, remote_navbar)
    print(f"  [OK] web/components/layout/Navbar.tsx")
else:
    print(f"  [SKIP] Navbar not found at {local_navbar}")
sftp.close()

print("\n文件上传完成！")
ssh.close()
