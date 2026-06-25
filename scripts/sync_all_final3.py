# -*- coding: utf-8 -*-
import paramiko
import os
import time
import base64
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=30)

def run(cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

local_base = r"c:\Users\Administrator\zhishuai"
remote_base = "/var/www/zhishuai"

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

print("通过 base64 上传文件...")
print()

uploaded = []
failed = []

for f in files_to_sync:
    local_path = os.path.join(local_base, f)
    remote_path = remote_base + "/" + f.replace("\\", "/")
    
    if not os.path.exists(local_path):
        print(f"  SKIP (local missing): {f}")
        failed.append(f)
        continue
    
    local_size = os.path.getsize(local_path)
    
    try:
        with open(local_path, 'rb') as fh:
            content = fh.read()
        
        b64_content = base64.b64encode(content).decode('ascii')
        
        # 分块写入
        chunk_size = 40000
        chunks = [b64_content[i:i+chunk_size] for i in range(0, len(b64_content), chunk_size)]
        
        run("> /tmp/sync_tmp_file")
        
        for chunk in chunks:
            escaped = chunk.replace("'", "'\\''")
            run(f"echo -n '{escaped}' >> /tmp/sync_tmp_file", timeout=10)
        
        # 确保目录存在
        remote_dir = os.path.dirname(remote_path)
        run(f"mkdir -p '{remote_dir}'", timeout=10)
        
        # 解码写入
        out, err = run(f"base64 -d /tmp/sync_tmp_file > '{remote_path}' 2>&1", timeout=10)
        if err:
            raise Exception(f"decode: {err[:100]}")
        
        # 验证
        out, err = run(f"wc -c < '{remote_path}'", timeout=10)
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

run("rm -f /tmp/sync_tmp_file", timeout=5)

print(f"\nUpload: {len(uploaded)} success, {len(failed)} failed")

if uploaded:
    print("\n开始构建...")
    
    # 生成 Prisma Client
    print("\n=== Prisma Generate ===")
    out, err = run("cd /var/www/zhishuai/server && npx prisma generate 2>&1", timeout=30)
    print(out[:300] if out else err[:300])
    
    # 构建 server - 使用 nohup 后台运行
    print("\n=== Build Server (后台) ===")
    run("cd /var/www/zhishuai/server && nohup npm run build > /tmp/server_build.log 2>&1 &", timeout=10)
    print("Server build started in background...")
    
    # 构建 web - 使用 nohup 后台运行
    print("\n=== Build Web (后台) ===")
    run("cd /var/www/zhishuai/web && nohup npm run build > /tmp/web_build.log 2>&1 &", timeout=10)
    print("Web build started in background...")
    
    # 等待构建完成
    print("\n等待构建完成...")
    max_wait = 180  # 最多等3分钟
    server_done = False
    web_done = False
    
    for i in range(max_wait // 5):
        time.sleep(5)
        
        if not server_done:
            out, _ = run("tail -3 /tmp/server_build.log 2>&1", timeout=5)
            if "error" in out.lower() or "Error" in out:
                print(f"Server build error: {out[:200]}")
                server_done = True
            elif "Successfully" in out or "Compiled successfully" in out:
                print(f"Server build done!")
                server_done = True
        
        if not web_done:
            out, _ = run("tail -3 /tmp/web_build.log 2>&1", timeout=5)
            if "error" in out.lower() or "Error" in out:
                print(f"Web build error: {out[:200]}")
                web_done = True
            elif "Compiled successfully" in out or "successfully" in out.lower():
                print(f"Web build done!")
                web_done = True
        
        if server_done and web_done:
            break
        
        if i % 3 == 0:
            print(f"  waiting... ({i*5}s)")
    
    # 检查构建结果
    print("\n=== Server Build Log (tail) ===")
    out, _ = run("tail -10 /tmp/server_build.log", timeout=5)
    print(out[:500])
    
    print("\n=== Web Build Log (tail) ===")
    out, _ = run("tail -10 /tmp/web_build.log", timeout=5)
    print(out[:500])
    
    # 重启 PM2
    print("\n=== 重启 PM2 ===")
    out, _ = run("pm2 restart all 2>&1", timeout=10)
    print(out[:300])
    
    time.sleep(5)
    
    print("\n=== 最终状态 ===")
    out, _ = run("pm2 jlist 2>&1", timeout=10)
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
        print(out[:300])

ssh.close()
