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

transport = ssh.get_transport()
channel = transport.open_session()
channel.exec_command("echo ok")
time.sleep(1)

def run_fast(cmd, wait=3):
    """快速执行命令，不等待完整输出"""
    transport = ssh.get_transport()
    channel = transport.open_session()
    channel.exec_command(cmd)
    time.sleep(wait)
    channel.close()

def run_out(cmd, timeout=15):
    """执行命令并获取输出"""
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
        
        # 直接通过 channel 发送
        remote_dir = os.path.dirname(remote_path)
        run_fast(f"mkdir -p '{remote_dir}'")
        
        # 分块写入
        chunk_size = 40000
        chunks = [b64_content[i:i+chunk_size] for i in range(0, len(b64_content), chunk_size)]
        
        run_fast("> /tmp/sync_tmp_file")
        
        for chunk in chunks:
            escaped = chunk.replace("'", "'\\''")
            run_fast(f"echo -n '{escaped}' >> /tmp/sync_tmp_file", wait=1)
        
        # 解码写入
        run_fast(f"base64 -d /tmp/sync_tmp_file > '{remote_path}'", wait=2)
        
        # 验证
        out, err = run_out(f"wc -c < '{remote_path}'")
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

run_fast("rm -f /tmp/sync_tmp_file")

print(f"\nUpload: {len(uploaded)} success, {len(failed)} failed")

if uploaded:
    print("\n=== Prisma Generate ===")
    out, _ = run_out("cd /var/www/zhishuai/server && npx prisma generate 2>&1")
    print(out[:300])
    
    # 后台构建
    print("\nStarting background builds...")
    run_fast("cd /var/www/zhishuai/server && nohup bash -c 'npm run build' > /tmp/server_build.log 2>&1 &")
    run_fast("cd /var/www/zhishuai/web && nohup bash -c 'npm run build' > /tmp/web_build.log 2>&1 &")
    print("Builds started. Waiting...")
    
    # 轮询检查
    for i in range(36):  # 最多等3分钟
        time.sleep(5)
        
        server_ok, _ = run_out("grep -c 'error TS' /tmp/server_build.log 2>/dev/null || echo 0")
        web_ok, _ = run_out("grep -c 'error' /tmp/web_build.log 2>/dev/null || echo 0")
        
        server_done, _ = run_out("tail -1 /tmp/server_build.log 2>/dev/null")
        web_done, _ = run_out("tail -1 /tmp/web_build.log 2>/dev/null")
        
        if i % 3 == 0:
            print(f"  [{i*5}s] server: {server_done[:60]} | web: {web_done[:60]}")
    
    print("\n=== Server Build Result ===")
    out, _ = run_out("tail -15 /tmp/server_build.log")
    print(out[:800])
    
    print("\n=== Web Build Result ===")
    out, _ = run_out("tail -15 /tmp/web_build.log")
    print(out[:800])
    
    # 重启
    print("\n=== Restart PM2 ===")
    run_fast("pm2 restart all")
    time.sleep(5)
    
    print("\n=== PM2 Status ===")
    out, _ = run_out("pm2 jlist 2>&1")
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
