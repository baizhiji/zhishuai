# -*- coding: utf-8 -*-
import paramiko
import os
import time
import base64
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

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

print("通过 base64 编码上传文件...")
print()

uploaded = []
failed = []

# 先修复权限
print("修复目录权限...")
run("sudo chown -R ubuntu:ubuntu /var/www/zhishuai 2>&1")

for f in files_to_sync:
    local_path = os.path.join(local_base, f)
    # 关键：使用正斜杠构建远程路径
    remote_path = remote_base + "/" + f.replace("\\", "/")
    
    if not os.path.exists(local_path):
        print(f"  SKIP (local missing): {f}")
        failed.append(f)
        continue
    
    local_size = os.path.getsize(local_path)
    
    try:
        # 读取文件内容并 base64 编码
        with open(local_path, 'rb') as fh:
            content = fh.read()
        
        b64_content = base64.b64encode(content).decode('ascii')
        
        # 分块写入（避免命令行长度限制）
        chunk_size = 40000  # 每块40KB
        chunks = [b64_content[i:i+chunk_size] for i in range(0, len(b64_content), chunk_size)]
        
        # 先清空临时文件
        run("> /tmp/sync_tmp_file")
        
        for i, chunk in enumerate(chunks):
            # 使用单引号包裹，避免特殊字符问题
            escaped = chunk.replace("'", "'\\''")
            run(f"echo -n '{escaped}' >> /tmp/sync_tmp_file")
        
        # 确保目标目录存在
        remote_dir = os.path.dirname(remote_path)
        run(f"mkdir -p '{remote_dir}'")
        
        # base64 解码并写入目标文件
        out, err = run(f"base64 -d /tmp/sync_tmp_file > '{remote_path}' 2>&1")
        if err:
            raise Exception(f"decode error: {err}")
        
        # 验证大小
        out, err = run(f"wc -c < '{remote_path}'")
        remote_size = int(out.strip()) if out.strip().isdigit() else 0
        
        if remote_size == local_size:
            uploaded.append(f)
            print(f"  OK ({local_size/1024:.1f}KB): {f}")
        else:
            print(f"  SIZE_MISMATCH (local={local_size}, remote={remote_size}): {f}")
            failed.append(f)
            
    except Exception as e:
        print(f"  FAIL: {f} - {e}")
        failed.append(f)

# 清理
run("rm -f /tmp/sync_tmp_file")

print()
print(f"Upload: {len(uploaded)} success, {len(failed)} failed")

if uploaded:
    print()
    print("=== 生成 Prisma Client ===")
    out, err = run("cd /var/www/zhishuai/server && npx prisma generate 2>&1")
    print(out if out else err[:200])
    
    print()
    print("=== 构建 Server ===")
    out, err = run("cd /var/www/zhishuai/server && npm run build 2>&1 | tail -30")
    print(out if out else err[:200])
    
    print()
    print("=== 构建 Web ===")
    out, err = run("cd /var/www/zhishuai/web && npm run build 2>&1 | tail -30")
    print(out if out else err[:200])
    
    print()
    print("=== 重启 PM2 ===")
    out, err = run("pm2 restart all 2>&1")
    print(out if out else err[:200])
    
    time.sleep(5)
    
    print()
    print("=== 最终状态 ===")
    out, err = run("pm2 jlist 2>&1")
    import json
    try:
        procs = json.loads(out)
        for p in procs:
            name = p.get('name', '?')
            status = p.get('pm2_env', {}).get('status', '?')
            uptime = p.get('pm2_env', {}).get('pm_uptime', 0)
            import datetime
            uptime_str = datetime.datetime.fromtimestamp(uptime/1000).strftime('%Y-%m-%d %H:%M:%S') if uptime else 'N/A'
            print(f"  {name}: {status}, since {uptime_str}")
    except:
        print(out[:500])

ssh.close()
