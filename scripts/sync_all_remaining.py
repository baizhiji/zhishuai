# -*- coding: utf-8 -*-
import paramiko
import os
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

# 需要同步的文件
files_to_sync = [
    "server/src/index.ts",
    "server/src/routes/notifications.ts",
    "server/src/routes/oauth.ts",
    "server/src/routes/social-account.ts",
    "server/src/services/browser-auth.service.ts",
    "server/src/services/push-service.ts",
    "shared/api/config.ts",
    "web/app/customer/layout/Navbar.tsx",
    "web/app/customer/media/matrix/page.tsx",
    "web/app/customer/social-accounts/page.tsx",
    "web/app/customer/recruitment/platforms/page.tsx",
    "web/app/notifications/page.tsx",
    "docker-compose.yml",
    "ecosystem.config.js",
    "apk/src/services/notification.service.ts",
    "server/.env.example",
]

sftp = ssh.open_sftp()

print("开始上传未同步的文件...")
print()

uploaded = []
failed = []

for f in files_to_sync:
    local_path = os.path.join(local_base, f)
    remote_path = os.path.join(remote_base, f)
    
    if not os.path.exists(local_path):
        print(f"  SKIP (本地不存在): {f}")
        failed.append(f)
        continue
    
    local_size = os.path.getsize(local_path)
    
    try:
        # 确保远程目录存在
        remote_dir = os.path.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except:
            run(f"mkdir -p '{remote_dir}'")
        
        sftp.put(local_path, remote_path)
        uploaded.append(f)
        print(f"  OK ({local_size/1024:.1f}KB): {f}")
    except Exception as e:
        print(f"  FAIL: {f} - {e}")
        failed.append(f)

sftp.close()

print()
print(f"Upload: {len(uploaded)} success, {len(failed)} failed")

if not failed:
    print()
    print("所有文件上传成功！现在重新构建并重启服务...")
    
    # 安装依赖 (如果有package.json变化)
    print()
    print("=== 安装 server 依赖 ===")
    out, err = run("cd /var/www/zhishuai/server && npm install --production 2>&1 | tail -5")
    print(out if out else err)
    
    # 生成 Prisma Client
    print()
    print("=== 生成 Prisma Client ===")
    out, err = run("cd /var/www/zhishuai/server && npx prisma generate 2>&1")
    print(out if out else err)
    
    # 构建 server
    print()
    print("=== 构建 Server ===")
    out, err = run("cd /var/www/zhishuai/server && npm run build 2>&1 | tail -20")
    print(out if out else err)
    
    # 构建 web
    print()
    print("=== 构建 Web ===")
    out, err = run("cd /var/www/zhishuai/web && npm run build 2>&1 | tail -20")
    print(out if out else err)
    
    # 重启 PM2
    print()
    print("=== 重启服务 ===")
    out, err = run("pm2 restart all 2>&1")
    print(out if out else err)
    
    # 等待几秒
    time.sleep(3)
    
    # 验证状态
    print()
    print("=== 服务状态 ===")
    out, err = run("pm2 status 2>&1")
    print(out if out else err)

ssh.close()
