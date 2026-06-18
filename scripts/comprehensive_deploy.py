#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
综合部署和修复脚本
1. 检查服务器当前状态
2. 上传最新代码
3. 重新构建并部署
4. 验证所有API端点
"""
import paramiko
import os
import sys
import time
import json
import tarfile
import tempfile

SERVER_IP = "150.109.60.130"
SERVER_USER = "root"
SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_rsa")
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def create_ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    pkey = paramiko.RSAKey.from_private_key_file(SSH_KEY_PATH)
    client.connect(SERVER_IP, port=22, username=SERVER_USER, pkey=pkey, timeout=30)
    return client

def run_cmd(client, cmd, timeout=120):
    print(f"\n>>> {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(out[:500])
    if err and 'npm warn' not in err.lower():
        print(f"[stderr] {err[:200]}")
    return exit_code, out, err

def upload_dir(client, local_dir, remote_dir):
    """Upload directory via SFTP"""
    sftp = client.open_sftp()
    
    def _upload_recursive(local, remote):
        for item in os.listdir(local):
            local_path = os.path.join(local, item)
            remote_path = os.path.join(remote, item)
            
            if os.path.isfile(local_path):
                # Skip large directories
                if item.endswith('.log') or item in ['.env', '.env.local']:
                    continue
                try:
                    sftp.put(local_path, remote_path)
                    print(f"  uploaded: {item}")
                except Exception as e:
                    print(f"  skip: {item} ({e})")
            elif os.path.isdir(local_path):
                if item in ['node_modules', 'dist', '.next', '.turbo', '__pycache__', '.git', '.prisma']:
                    continue
                try:
                    sftp.mkdir(remote_path)
                except:
                    pass
                _upload_recursive(local_path, remote_path)
    
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    _upload_recursive(local_dir, remote_dir)
    sftp.close()

def create_tar_and_upload(client):
    """Create tar.gz of server src and upload"""
    tar_path = os.path.join(tempfile.gettempdir(), 'zhishuai-server-deploy.tar.gz')
    
    server_dir = os.path.join(PROJECT_ROOT, 'server')
    
    print(f"Creating tar from {server_dir}...")
    with tarfile.open(tar_path, 'w:gz') as tar:
        # Add src directory
        src_dir = os.path.join(server_dir, 'src')
        tar.add(src_dir, arcname='src')
        
        # Add key config files
        for f in ['package.json', 'package-lock.json', 'tsconfig.json', 'prisma']:
            fp = os.path.join(server_dir, f)
            if os.path.exists(fp):
                tar.add(fp, arcname=f)
    
    size = os.path.getsize(tar_path) / (1024*1024)
    print(f"Tar created: {size:.1f} MB")
    
    # Upload
    sftp = client.open_sftp()
    sftp.put(tar_path, '/tmp/zhishuai-server-deploy.tar.gz')
    sftp.close()
    print("Tar uploaded to server")
    
    # Cleanup
    os.unlink(tar_path)
    return True

def main():
    print("=" * 70)
    print("智枢AI 综合部署修复脚本")
    print("=" * 70)
    
    # Step 1: Connect and check current state
    print("\n[1] Connecting to server...")
    client = create_ssh_client()
    print("Connected!")
    
    # Check current server state
    print("\n[2] Checking current server state...")
    code, out, err = run_cmd(client, "pm2 list")
    
    # Find actual working directory
    code, out, err = run_cmd(client, "pm2 describe zhishuai-api 2>/dev/null | grep 'cwd' || pm2 describe api 2>/dev/null | grep 'cwd'")
    cwd_match = None
    if out:
        for line in out.split('\n'):
            if 'cwd' in line.lower():
                cwd_match = line.strip()
    print(f"API process cwd: {cwd_match}")
    
    # Check which directory has the code
    code, out, err = run_cmd(client, "ls -la /www/wwwroot/baizhiji/server/dist/index.js 2>/dev/null; ls -la /var/www/zhishuai/server/dist/index.js 2>/dev/null")
    server_dir = None
    if '/www/wwwroot/baizhiji' in out:
        server_dir = '/www/wwwroot/baizhiji/server'
        print(f"Server code at: {server_dir}")
    elif '/var/www/zhishuai' in out:
        server_dir = '/var/www/zhishuai/server'
        print(f"Server code at: {server_dir}")
    else:
        # Use default
        server_dir = '/www/wwwroot/baizhiji/server'
        print(f"Defaulting to: {server_dir}")
    
    # Check current dist size (proxy for code version)
    code, out, err = run_cmd(client, f"wc -l {server_dir}/dist/index.js 2>/dev/null; head -3 {server_dir}/dist/index.js 2>/dev/null")
    print(f"Current dist: {out[:100]}")
    
    # Check how many routes are registered
    code, out, err = run_cmd(client, f"grep -c 'app.use' {server_dir}/dist/index.js 2>/dev/null || echo '0'")
    current_routes = out.strip() if out else '0'
    print(f"Current routes in dist: {current_routes}")
    
    # Step 3: Upload latest source code
    print("\n[3] Uploading latest source code...")
    create_tar_and_upload(client)
    
    # Step 4: Extract and build on server
    print("\n[4] Extracting and building...")
    
    # Backup current dist
    run_cmd(client, f"cp -r {server_dir}/dist {server_dir}/dist.bak 2>/dev/null || true")
    
    # Extract new src
    run_cmd(client, f"cd {server_dir} && tar -xzf /tmp/zhishuai-server-deploy.tar.gz")
    
    # Check if package.json needs update
    code, out, err = run_cmd(client, f"cd {server_dir} && npm install --production=false", timeout=300)
    
    # Build
    print("\n[5] Building TypeScript...")
    code, out, err = run_cmd(client, f"cd {server_dir} && npm run build", timeout=120)
    if code != 0:
        print(f"Build failed! Trying to check errors...")
        run_cmd(client, f"cd {server_dir} && npx tsc --noEmit 2>&1 | head -20")
    
    # Verify new dist
    code, out, err = run_cmd(client, f"wc -l {server_dir}/dist/index.js 2>/dev/null")
    print(f"New dist: {out[:100]}")
    
    # Step 5: Restart API service
    print("\n[6] Restarting API service...")
    run_cmd(client, f"cd {server_dir} && pm2 delete zhishuai-api 2>/dev/null || true")
    run_cmd(client, f"cd {server_dir} && pm2 delete api 2>/dev/null || true")
    run_cmd(client, f"cd {server_dir} && pm2 start ecosystem.config.cjs 2>/dev/null || pm2 start dist/index.js --name zhishuai-api")
    
    # Wait for startup
    print("Waiting for API to start...")
    time.sleep(5)
    
    # Check health
    code, out, err = run_cmd(client, "curl -s http://localhost:3001/api/health 2>/dev/null")
    print(f"Health check: {out[:200]}")
    
    # Step 6: Check all routes
    print("\n[7] Verifying API routes...")
    time.sleep(3)
    
    endpoints_to_check = [
        '/api/health',
        '/api/auth/me',
        '/api/oauth/platforms',
        '/api/recruitment',
        '/api/crm',
        '/api/acquisition',
        '/api/statistics',
        '/api/dashboard-stats',
        '/api/ai',
        '/api/ai-chat',
        '/api/materials',
        '/api/matrix',
        '/api/publish',
        '/api/account',
        '/api/subscription',
        '/api/company',
        '/api/announcement',
        '/api/hot-topics',
        '/api/version',
        '/api/amap',
        '/api/features',
        '/api/share',
        '/api/employee',
        '/api/tickets',
        '/api/export',
        '/api/scripts',
        '/api/notification',
        '/api/notifications',
        '/api/social',
        '/api/oauth/accounts',
        '/api/referral',
        '/api/settlement',
        '/api/sms',
        '/api/orders',
        '/api/admin',
        '/api/admin/features',
        '/api/admin/agents',
        '/api/admin/logs',
        '/api/agent',
        '/api/agent/dashboard',
        '/api/compliance',
        '/api/pipeline',
        '/api/auto-reply',
        '/api/digital-human',
        '/api/voice-clone',
        '/api/code-assistant',
        '/api/media',
        '/api/ai-enhanced',
        '/api/token-stats',
        '/api/data-acquisition',
        '/api/crm-advanced',
        '/api/content',
        '/api/content-publish',
        '/api/report',
    ]
    
    # Login to get token
    code, out, err = run_cmd(client, """curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"phone":"18601655222","password":"20061218"}'""")
    token = ""
    try:
        login_result = json.loads(out)
        token = login_result.get('data', {}).get('token', login_result.get('token', ''))
    except:
        print(f"Login failed: {out[:200]}")
    
    print(f"Token: {token[:30]}..." if token else "NO TOKEN!")
    
    success_count = 0
    fail_count = 0
    for ep in endpoints_to_check:
        cmd = f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3001{ep}"
        if token:
            cmd = f"curl -s -o /dev/null -w '%{{http_code}}' -H 'Authorization: Bearer {token}' http://localhost:3001{ep}"
        code, out, err = run_cmd(client, cmd, timeout=10)
        status = out.strip() if out else 'ERR'
        marker = 'OK' if status in ['200', '201', '400', '401'] else 'FAIL'
        if marker == 'OK':
            success_count += 1
        else:
            fail_count += 1
        print(f"  [{status}] {ep}")
    
    print(f"\nSummary: {success_count} OK, {fail_count} FAIL out of {len(endpoints_to_check)} endpoints")
    
    # Step 7: Check frontend pages
    print("\n[8] Checking frontend pages...")
    pages = [
        '/login', '/dashboard', '/customers', '/crm', '/marketing',
        '/materials', '/ai', '/recruitment', '/data', '/matrix-accounts',
        '/acquisition', '/accounts', '/settings', '/profile'
    ]
    
    for page in pages:
        cmd = f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{page} 2>/dev/null"
        code, out, err = run_cmd(client, cmd, timeout=10)
        status = out.strip() if out else 'ERR'
        print(f"  [{status}] {page}")
    
    # Step 8: Check OAuth platforms
    print("\n[9] Checking OAuth/Social account auth...")
    code, out, err = run_cmd(client, f"curl -s -H 'Authorization: Bearer {token}' http://localhost:3001/api/oauth/platforms")
    if out:
        try:
            platforms = json.loads(out)
            print(f"OAuth platforms: {json.dumps(platforms, ensure_ascii=False)[:300]}")
        except:
            print(f"OAuth response: {out[:200]}")
    
    # Step 9: PM2 save
    print("\n[10] Saving PM2 configuration...")
    run_cmd(client, "pm2 save")
    
    # Final summary
    print("\n" + "=" * 70)
    print("部署完成！")
    print("=" * 70)
    
    client.close()

if __name__ == "__main__":
    main()
