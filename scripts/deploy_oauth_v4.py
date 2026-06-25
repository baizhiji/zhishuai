"""
Deploy OAuth fix v4 - use SSH command-based file transfer
"""
import paramiko
import time
import os
import base64

HOST = '150.109.60.130'
USER = 'ubuntu'
REMOTE_DIR = '/workspace/zhishuai'
LOCAL_DIR = r'c:\Users\Administrator\zhishuai'

def ssh_exec(client, cmd, timeout=120, silent=False):
    """Execute SSH command"""
    print(f"[SSH] {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if not silent and out:
        try:
            print(out[-2000:])
        except UnicodeEncodeError:
            print(out[-2000:].encode('ascii', errors='replace').decode('ascii'))
    if code != 0 and not silent:
        try:
            err_lines = err.split('\n')[-3:]
            print(f"  ERR: {' | '.join(err_lines)}")
        except:
            pass
    return out, err, code

def upload_file_via_base64(client, local_path, remote_path, max_chunk=50000):
    """Upload file by encoding to base64 and writing on remote side"""
    print(f"[UPLOAD] {os.path.basename(local_path)} -> {remote_path}")
    
    with open(local_path, 'rb') as f:
        data = f.read()
    
    encoded = base64.b64encode(data).decode('ascii')
    total_len = len(encoded)
    
    # Write in chunks to avoid command length limits
    print(f"  File size: {len(data)} bytes, encoded: {total_len}")
    
    # Create remote file using python base64 decode
    # First create the directory if needed
    remote_dir = os.path.dirname(remote_path)
    ssh_exec(client, f"mkdir -p {remote_dir}", timeout=10, silent=True)
    
    # Write encoded data in chunks
    chunk_size = max_chunk  # ~50KB per chunk should be safe for command line
    chunks = [encoded[i:i+chunk_size] for i in range(0, len(encoded), chunk_size)]
    
    # Use a temp file approach: write each chunk, append
    for i, chunk in enumerate(chunks):
        escaped = chunk.replace("'", "'\\''")  # Escape single quotes
        if i == 0:
            ssh_exec(client, f"printf '%s' '{escaped}' > /tmp/upload_tmp.b64", timeout=30, silent=True)
        else:
            ssh_exec(client, f"printf '%s' '{escaped}' >> /tmp/upload_tmp.b64", timeout=30, silent=True)
        
        if (i + 1) % 10 == 0:
            print(f"  Uploaded {i+1}/{len(chunks)} chunks...")
    
    # Decode the base64 file to final destination
    result, _, code = ssh_exec(client, 
        f"base64 -d /tmp/upload_tmp.b64 > {remote_path} && echo 'OK' && rm /tmp/upload_tmp.b64 && wc -c {remote_path}",
        timeout=30, silent=False)
    
    if 'OK' in result:
        print(f"  Upload complete!")
    else:
        print(f"  Upload may have failed: {result.strip()[:100]}")
    
    return True

def main():
    print("=" * 60)
    print("Deploying OAuth Fix V4...")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password='Hao20061218', timeout=15)
    print("Connected!\n")
    
    # Step 1: Pre-check
    print("--- [1] Health check ---")
    ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health 2>/dev/null || echo 'unavailable'", timeout=10, silent=True)
    
    # Step 2: Upload browser-auth.service.js
    print("\n--- [2] Upload browser-auth.service.js ---")
    local_dist = os.path.join(LOCAL_DIR, 'server', 'dist', 'services', 'browser-auth.service.js')
    remote_dist = f'{REMOTE_DIR}/server/dist/services/browser-auth.service.js'
    
    # Backup
    ssh_exec(client, f"cp {remote_dist} {remote_dist}.bak.v3 2>/dev/null; echo done", timeout=5, silent=True)
    
    upload_file_via_base64(client, local_dist, remote_dist)
    
    # Verify
    result, _, _ = ssh_exec(client, f"wc -c {remote_dist} && grep -c 'smartFindQRCode' {remote_dist}", timeout=10)
    print(f"  Verify: {result.strip()}")
    
    # Step 3: Upload recruitment platforms page  
    print("\n--- [3] Upload recruitment/platforms/page.tsx ---")
    local_page = os.path.join(LOCAL_DIR, 'web', 'app', 'customer', 'recruitment', 'platforms', 'page.tsx')
    remote_page = f'{REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx'
    upload_file_via_base64(client, local_page, remote_page)
    
    # Step 4: Build web
    print("\n--- [4] Build web ---")
    ssh_exec(client, f"cd {REMOTE_DIR}/web && npm run build 2>&1 | tail -5", timeout=300, silent=False)
    
    # Step 5: Restart API
    print("\n--- [5] Restart services ---")
    # Find running node processes
    ssh_exec(client, "ps aux | grep 'node.*server/dist' | grep -v grep | head -3", timeout=10, silent=True)
    
    # Kill existing node processes for this project
    ssh_exec(client, "pkill -f 'node.*server/dist' 2>/dev/null; sleep 2; echo 'killed'", timeout=10, silent=True)
    
    # Start new process
    ssh_exec(client, 
        f"cd {REMOTE_DIR}/server && nohup node dist/index.js > /tmp/api_oauth.log 2>&1 &",
        timeout=15, silent=False)
    
    time.sleep(5)
    
    # Step 6: Verify
    print("\n--- [6] Verification ---")
    for attempt in range(5):
        result, _, _ = ssh_exec(client, 
            "curl -s http://localhost:3001/api/health 2>/dev/null || echo 'not_ready'",
            timeout=10, silent=True)
        if 'ok' in result.lower() or '200' in result:
            break
        time.sleep(2)
    
    # Test OAuth endpoint
    print("\n--- [7] Test OAuth ---")
    ssh_exec(client, 
        "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null | python3 -m json.tool 2>/dev/null | head -40",
        timeout=15, silent=False)
    
    print("\n" + "=" * 60)
    print("DEPLOY COMPLETE")
    print("=" * 60)
    client.close()

if __name__ == '__main__':
    main()
