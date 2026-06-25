"""Final deployment: upload recruitment page, rebuild web, hard restart PM2"""
import paramiko
import time
import os
import base64

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_DIR = '/var/www/zhishuai'
LOCAL_DIR = r'c:\Users\Administrator\zhishuai'

def ssh_exec(client, cmd, timeout=300, silent=False):
    if not silent:
        print(f"[SSH] {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if not silent and out.strip():
        print(out[-2000:].encode('ascii', errors='replace').decode('ascii'))
    if code != 0 and not silent and err.strip():
        print(f"  ERR: {err[-500:].encode('ascii', errors='replace').decode('ascii')}")
    return out, err, code

def upload_file_via_base64(client, local_path, remote_path, max_chunk=50000):
    print(f"[UPLOAD] {os.path.basename(local_path)} -> {remote_path}")
    
    with open(local_path, 'rb') as f:
        data = f.read()
    
    encoded = base64.b64encode(data).decode('ascii')
    print(f"  Size: {len(data)} bytes")
    
    remote_dir = os.path.dirname(remote_path)
    ssh_exec(client, f"mkdir -p {remote_dir}", timeout=10, silent=True)
    ssh_exec(client, f"cp {remote_path} {remote_path}.bak2 2>/dev/null || echo 'no old'", timeout=5, silent=True)
    
    chunk_size = max_chunk
    chunks = [encoded[i:i+chunk_size] for i in range(0, len(encoded), chunk_size)]
    
    for i, chunk in enumerate(chunks):
        escaped = chunk.replace("'", "'\\''")
        if i == 0:
            ssh_exec(client, f"printf '%s' '{escaped}' > /tmp/upload_tmp.b64", timeout=30, silent=True)
        else:
            ssh_exec(client, f"printf '%s' '{escaped}' >> /tmp/upload_tmp.b64", timeout=30, silent=True)
    
    result, _, _ = ssh_exec(client, 
        f"base64 -d /tmp/upload_tmp.b64 > {remote_path} && echo 'OK' && rm /tmp/upload_tmp.b64 && wc -c {remote_path}",
        timeout=30)
    
    return 'OK' in result

def main():
    print("=" * 60)
    print("Final V4 Deployment")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # Step 1: Upload updated recruitment page.tsx
    print("--- [1] Upload recruitment page.tsx ---")
    local_page = os.path.join(LOCAL_DIR, 'web', 'app', 'customer', 'recruitment', 'platforms', 'page.tsx')
    remote_page = f'{REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx'
    
    success = upload_file_via_base64(client, local_page, remote_page)
    if success:
        # Verify no authUrl field
        result, _, _ = ssh_exec(client, f"grep -c 'authUrl' {remote_page}", timeout=5)
        print(f"  authUrl count: {result.strip()} (should be 0)")
        result, _, _ = ssh_exec(client, f"grep -c 'oauth/sessions' {remote_page}", timeout=5)
        print(f"  oauth/sessions count: {result.strip()} (should be 1)")
        result, _, _ = ssh_exec(client, f"grep -c 'QrcodeOutlined' {remote_page}", timeout=5)
        print(f"  QrcodeOutlined count: {result.strip()} (should be >0)")

    # Step 2: Rebuild web frontend
    print("\n--- [2] Rebuild web ---")
    ssh_exec(client, f"cd {REMOTE_DIR}/web && npm run build 2>&1 | tail -30", timeout=300)
    
    # Step 3: Hard restart PM2 for both API and web
    print("\n--- [3] Hard restart PM2 ---")
    # Stop both, then start fresh
    ssh_exec(client, "pm2 stop zhishuai-api 2>/dev/null; pm2 stop zhishuai-web 2>/dev/null; echo 'stopped'", timeout=15)
    time.sleep(2)
    
    # Delete PM2 processes (to clear any cached module state)
    ssh_exec(client, "pm2 delete zhishuai-api 2>/dev/null; pm2 delete zhishuai-web 2>/dev/null; echo 'deleted'", timeout=15)
    time.sleep(2)
    
    # Start fresh using ecosystem config
    ssh_exec(client, f"cd {REMOTE_DIR} && pm2 start ecosystem.config.js 2>&1 | tail -10", timeout=30)
    
    time.sleep(8)

    # Step 4: Verify both services are running
    print("\n--- [4] Verify services ---")
    ssh_exec(client, "pm2 list 2>/dev/null", timeout=10)
    
    # Step 5: Test OAuth API
    print("\n--- [5] Test OAuth API ---")
    out, _, _ = ssh_exec(client, 
        "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null",
        timeout=15, silent=True)
    
    if 'boss' in out and 'liepin' in out:
        print("  V4 API confirmed - recruitment platforms present!")
        print(f"  {out.encode('ascii', errors='replace').decode('ascii')[:300]}")
    else:
        print("  WARNING: Recruitment platforms may not be in API response")
        print(f"  {out.encode('ascii', errors='replace').decode('ascii')[:300]}")

    # Step 6: Verify web is serving
    print("\n--- [6] Verify web ---")
    out, _, _ = ssh_exec(client,
        "curl -s http://localhost:3000/ 2>/dev/null | head -c 200",
        timeout=10, silent=True)
    print(f"  Web root: {out.encode('ascii', errors='replace').decode('ascii')[:200]}")

    # Step 7: Save PM2 config so it persists on reboot
    print("\n--- [7] Save PM2 ---")
    ssh_exec(client, "pm2 save 2>/dev/null && echo 'saved'", timeout=10)

    print("\n" + "=" * 60)
    print("FINAL DEPLOY COMPLETE!")
    print("=" * 60)
    client.close()

if __name__ == '__main__':
    main()
