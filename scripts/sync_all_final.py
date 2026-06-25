# -*- coding: utf-8 -*-
import paramiko
import os
import time
import base64

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

for f in files_to_sync:
    local_path = os.path.join(local_base, f)
    remote_path = os.path.join(remote_base, f)
    
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
        chunk_size = 50000  # 每块50KB
        chunks = [b64_content[i:i+chunk_size] for i in range(0, len(b64_content), chunk_size)]
        
        # 先清空文件
        run(f"echo -n '' > /tmp/sync_tmp_file")
        
        for i, chunk in enumerate(chunks):
            run(f"echo -n '{chunk}' >> /tmp/sync_tmp_file")
        
        # base64 解码并写入目标文件
        out, err = run(f"base64 -d /tmp/sync_tmp_file > '{remote_path}' 2>&1")
        if err:
            raise Exception(f"decode error: {err}")
        
        # 验证
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

# 清理临时文件
run("rm -f /tmp/sync_tmp_file")

print()
print(f"Upload: {len(uploaded)} success, {len(failed)} failed")

if uploaded:
    print()
    print("文件上传成功！现在重新构建并重启服务...")
    
    # 生成 Prisma Client
    print()
    print("=== 生成 Prisma Client ===")
    out, err = run("cd /var/www/zhishuai/server && npx prisma generate 2>&1")
    print(out if out else err)
    
    # 构建 server
    print()
    print("=== 构建 Server (npm run build) ===")
    out, err = run("cd /var/www/zhishuai/server && npm run build 2>&1 | tail -30")
    print(out if out else err)
    
    # 构建 web
    print()
    print("=== 构建 Web (npm run build) ===")
    out, err = run("cd /var/www/zhishuai/web && npm run build 2>&1 | tail -30")
    print(out if out else err)
    
    # 重启 PM2
    print()
    print("=== 重启 PM2 服务 ===")
    out, err = run("pm2 restart all 2>&1")
    print(out if out else err)
    
    # 等待启动
    time.sleep(5)
    
    # 验证状态
    print()
    print("=== 最终服务状态 ===")
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
        print(out)

ssh.close()
