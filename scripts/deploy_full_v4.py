"""Deploy V4 fixes: 1) restart API via PM2, 2) update recruitment page.tsx and rebuild web"""
import paramiko
import time
import os
import base64

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_DIR = '/var/www/zhishuai'
LOCAL_DIR = r'c:\Users\Administrator\zhishuai'

def ssh_exec(client, cmd, timeout=120, silent=False):
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
    print(f"  Size: {len(data)} bytes, encoded: {len(encoded)}")
    
    remote_dir = os.path.dirname(remote_path)
    ssh_exec(client, f"mkdir -p {remote_dir}", timeout=10, silent=True)
    ssh_exec(client, f"cp {remote_path} {remote_path}.bak 2>/dev/null || echo 'no old file'", timeout=5, silent=True)
    
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
    print("Full V4 Deploy: PM2 restart + recruitment page update")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # Step 1: Check PM2 status
    print("--- [1] PM2 status ---")
    ssh_exec(client, "pm2 list 2>/dev/null", timeout=10)
    
    # Step 2: Find which PM2 process manages our API
    print("\n--- [2] PM2 process details ---")
    ssh_exec(client, "pm2 jlist 2>/dev/null | python3 -c \"import sys,json; procs=json.load(sys.stdin); for p in procs: print(p.get('name','?'), p.get('pm2_env',{}).get('pm_exec_path','?'), p.get('pm_id','?'))\" 2>/dev/null || echo 'pm2 jlist failed'", timeout=10)

    # Step 3: Upload recruitment platforms page.tsx (the fixed version)
    print("\n--- [3] Upload fixed recruitment page.tsx ---")
    local_page = os.path.join(LOCAL_DIR, 'web', 'app', 'customer', 'recruitment', 'platforms', 'page.tsx')
    remote_page = f'{REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx'
    
    success = upload_file_via_base64(client, local_page, remote_page)
    if success:
        # Verify no more oauth/initiate calls
        result, _, _ = ssh_exec(client, f"grep -c 'oauth/initiate' {remote_page}", timeout=5)
        print(f"  oauth/initiate count: {result.strip()} (should be 0)")
        result, _, _ = ssh_exec(client, f"grep -c 'oauth/sessions' {remote_page}", timeout=5)
        print(f"  oauth/sessions count: {result.strip()} (should be >0)")
    
    # Step 4: Rebuild web frontend
    print("\n--- [4] Rebuild web frontend ---")
    ssh_exec(client, f"cd {REMOTE_DIR}/web && npm run build 2>&1 | tail -20", timeout=300)
    
    # Step 5: Restart API via PM2
    print("\n--- [5] Restart API via PM2 ---")
    # First try: pm2 restart the process that's running our server
    out, _, _ = ssh_exec(client, "pm2 restart 0 2>/dev/null || pm2 restart zhishuai-api 2>/dev/null || echo 'pm2 restart failed'", timeout=30)
    
    # If PM2 doesn't know our process, kill PM2 process and start fresh
    if 'failed' in out.lower():
        print("  PM2 restart failed, trying alternative...")
        # Kill PM2's process on port 3001
        ssh_exec(client, "pm2 delete 0 2>/dev/null; pm2 delete all 2>/dev/null; echo 'pm2 cleared'", timeout=10)
        time.sleep(2)
        # Start our process directly
        ssh_exec(client, f"cd {REMOTE_DIR}/server && pm2 start dist/index.js --name zhishuai-api 2>/dev/null", timeout=30)
    
    time.sleep(5)
    
    # Step 6: Verify API is running with V4 code
    print("\n--- [6] Verify V4 API ---")
    for attempt in range(10):
        out, _, _ = ssh_exec(client, 
            "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null | head -c 300",
            timeout=10, silent=True)
        if 'boss' in out and 'zhilian' in out:
            print(f"  V4 API confirmed! (attempt {attempt+1})")
            print(f"  {out.encode('ascii', errors='replace').decode('ascii')[:200]}")
            break
        print(f"  Waiting... {attempt+1}")
        time.sleep(3)
    
    # Step 7: Verify PM2 is managing the correct process
    print("\n--- [7] Final PM2 check ---")
    ssh_exec(client, "pm2 list 2>/dev/null | grep -i zhishuai || echo 'not in pm2'", timeout=10)
    
    # Step 8: Verify recruitment page rebuilt
    print("\n--- [8] Verify web rebuild ---")
    ssh_exec(client, f"grep -c 'oauth/sessions' {REMOTE_DIR}/web/.next/server/app/customer/recruitment/platforms/auto.rsc 2>/dev/null || echo 'no sessions in compiled'", timeout=5)
    ssh_exec(client, f"grep -c 'oauth/initiate' {REMOTE_DIR}/web/.next/server/app/customer/recruitment/platforms/auto.rsc 2>/dev/null || echo 'no initiate in compiled'", timeout=5)

    # Step 9: Also restart the web frontend if needed
    print("\n--- [9] Check web process ---")
    ssh_exec(client, "ps aux | grep 'next' | grep -v grep | head -3", timeout=10)

    print("\n" + "=" * 60)
    print("DEPLOY COMPLETE")
    print("=" * 60)
    client.close()

if __name__ == '__main__':
    main()
