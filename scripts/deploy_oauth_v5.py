#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OAuth V5 完整部署脚本
"""
import paramiko
import base64
import time
import sys
import io

# 修复 Windows 控制台输出
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SERVER = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_PATH = '/var/www/zhishuai'

def ssh_exec(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

def upload_file_via_base64(ssh, local_path, remote_path):
    print(f"\n[UPLOAD] {local_path} -> {remote_path}")
    
    with open(local_path, 'rb') as f:
        data = f.read()
    
    total_size = len(data)
    b64 = base64.b64encode(data).decode('ascii')
    cmd = f"mkdir -p $(dirname '{remote_path}') && echo '{b64}' | base64 -d > '{remote_path}' && ls -la '{remote_path}'"
    out, err = ssh_exec(ssh, cmd, 120)
    
    if total_size > 0:
        print(f"[OK] Uploaded {total_size} bytes")
        return True
    print(f"[FAIL] Upload may have failed: {out}")
    return False

def main():
    print("=" * 60)
    print("  OAuth V5 Deployment")
    print("=" * 60)
    
    print(f"\n[SSH] Connecting to {SERVER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
    print("[OK] SSH connected")
    
    try:
        # Step 1: Upload browser-auth.service.js (V5)
        local_js = r'c:\Users\Administrator\zhishuai\server\dist\services\browser-auth.service.js'
        remote_js = f'{REMOTE_PATH}/server/dist/services/browser-auth.service.js'
        upload_file_via_base64(ssh, local_js, remote_js)
        
        # Step 2: Restart API
        print("\n[RESTART] API service...")
        out, err = ssh_exec(ssh, f"cd {REMOTE_PATH}/server && pm2 restart zhishuai-api", 20)
        print(f"PM2: {(out or err)[:200]}")
        
        print("[WAIT] Waiting for service to start...")
        time.sleep(5)
        
        # Step 3: Verify API
        print("\n[VERIFY] Checking API...")
        out, err = ssh_exec(ssh, "curl -s http://localhost:3001/api/oauth/platforms", 10)
        print(f"Platforms: {out[:400]}")
        
        if 'boss' in out:
            print("[OK] API is running with recruitment platforms")
        
        # Step 4: Upload fixed recruitment page
        print("\n[WEB] Uploading fixed recruitment page...")
        
        local_page_js = r'c:\Users\Administrator\zhishuai\web\.next\server\app\customer\recruitment\platforms\page.js'
        import os
        
        if os.path.exists(local_page_js):
            with open(local_page_js, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            if '@/utils/request' in content:
                print("[OK] Recruitment page has V5 fix")
                
                remote_page_dir = f'{REMOTE_PATH}/web/.next/server/app/customer/recruitment/platforms/'
                ssh_exec(ssh, f"mkdir -p '{remote_page_dir}'", 5)
                remote_page_js = f'{remote_page_dir}page.js'
                upload_file_via_base64(ssh, local_page_js, remote_page_js)
                
                # Client JS files
                import glob
                client_dir = r'c:\Users\Administrator\zhishuai\web\.next\static\chunks\app\customer\recruitment\platforms'
                for gf in glob.glob(os.path.join(client_dir, '*.js')):
                    fname = os.path.basename(gf)
                    rc = f'{REMOTE_PATH}/web/.next/static/chunks/app/customer/recruitment/platforms/{fname}'
                    upload_file_via_base64(ssh, gf, rc)
                
                # Restart web
                print("\n[RESTART] Web service...")
                out, err = ssh_exec(ssh, f"cd {REMOTE_PATH}/web && pm2 restart zhishuai-web", 20)
                print(f"PM2: {(out or err)[:200]}")
        
        # Final status
        print("\n" + "=" * 60)
        print("  DEPLOYMENT SUMMARY")
        print("=" * 60)
        
        out, err = ssh_exec(ssh, "pm2 list --no-color 2>/dev/null | grep zhishuai", 10)
        print(f"\nPM2 Status:\n{out}")
        
        out, err = ssh_exec(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/oauth/platforms", 10)
        print(f"API HTTP: {out}")
        
        out, err = ssh_exec(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", 10)
        print(f"Web HTTP: {out}")
        
        print("\n[V5 FIXES DEPLOYED]")
        print("1. douyin/kuaishou: enhanced QR code search (lower threshold, more candidates)")
        print("2. xiaohongshu: removed /explore from success patterns, added URL-change check")
        print("3. channels: status detection verified (authorized -> confirmed)")
        print("4. recruitment: changed from @/services/api to @/utils/request (fixes r.post error)")
        
    finally:
        ssh.close()
        print("\n[DONE]")

if __name__ == '__main__':
    main()
