"""Deploy OAuth Fix V4 to /var/www/zhishuai/ - correct remote path"""
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
    print(f"[SSH] {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if not silent and out.strip():
        safe = out[-2000:].encode('ascii', errors='replace').decode('ascii')
        print(safe)
    if code != 0 and not silent and err.strip():
        safe_err = err[-500:].encode('ascii', errors='replace').decode('ascii')
        print(f"  ERR: {safe_err}")
    return out, err, code

def upload_file_via_base64(client, local_path, remote_path, max_chunk=50000):
    print(f"[UPLOAD] {os.path.basename(local_path)} -> {remote_path}")
    
    with open(local_path, 'rb') as f:
        data = f.read()
    
    encoded = base64.b64encode(data).decode('ascii')
    total_len = len(encoded)
    print(f"  File size: {len(data)} bytes, encoded: {total_len}")
    
    # Create remote directory if needed
    remote_dir = os.path.dirname(remote_path)
    ssh_exec(client, f"mkdir -p {remote_dir}", timeout=10, silent=True)
    
    # Backup existing file
    ssh_exec(client, f"cp {remote_path} {remote_path}.bak.v3 2>/dev/null || echo 'no backup needed'", timeout=5, silent=True)
    
    # Write encoded data in chunks
    chunk_size = max_chunk
    chunks = [encoded[i:i+chunk_size] for i in range(0, len(encoded), chunk_size)]
    
    for i, chunk in enumerate(chunks):
        escaped = chunk.replace("'", "'\\''")
        if i == 0:
            ssh_exec(client, f"printf '%s' '{escaped}' > /tmp/upload_tmp.b64", timeout=30, silent=True)
        else:
            ssh_exec(client, f"printf '%s' '{escaped}' >> /tmp/upload_tmp.b64", timeout=30, silent=True)
        
        if (i + 1) % 10 == 0:
            print(f"  Uploaded {i+1}/{len(chunks)} chunks...")
    
    # Decode to final destination
    result, _, _ = ssh_exec(client, 
        f"base64 -d /tmp/upload_tmp.b64 > {remote_path} && echo 'UPLOAD_OK' && rm /tmp/upload_tmp.b64 && wc -c {remote_path}",
        timeout=30, silent=False)
    
    if 'UPLOAD_OK' in result:
        print(f"  Upload complete!")
        return True
    else:
        print(f"  Upload may have failed!")
        return False

def main():
    print("=" * 60)
    print("Deploying OAuth Fix V4 to /var/www/zhishuai/...")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")
    
    # Step 1: Verify remote project structure
    print("--- [1] Verify remote structure ---")
    ssh_exec(client, f"ls -la {REMOTE_DIR}/server/dist/services/browser-auth.service.js", timeout=10)
    ssh_exec(client, f"ls -la {REMOTE_DIR}/server/dist/index.js", timeout=10)
    
    # Step 2: Upload browser-auth.service.js
    print("\n--- [2] Upload browser-auth.service.js ---")
    local_dist = os.path.join(LOCAL_DIR, 'server', 'dist', 'services', 'browser-auth.service.js')
    remote_dist = f'{REMOTE_DIR}/server/dist/services/browser-auth.service.js'
    
    success = upload_file_via_base64(client, local_dist, remote_dist)
    
    if success:
        # Verify new code has V4 features
        result, _, _ = ssh_exec(client, f"grep -c 'smartFindQRCode' {remote_dist} && grep -c 'successUrlPatterns' {remote_dist} && grep -c 'boss' {remote_dist}", timeout=10)
        print(f"  V4 feature check: {result.strip()}")
    
    # Step 3: Restart API service
    print("\n--- [3] Restart API service ---")
    
    # Find the running process
    out, _, _ = ssh_exec(client, "ps aux | grep 'node.*server/dist' | grep -v grep | head -3", timeout=10, silent=False)
    
    # Kill the old process
    ssh_exec(client, f"kill $(pgrep -f 'node.*{REMOTE_DIR}/server/dist/index.js' | head -1) 2>/dev/null; sleep 2; echo 'killed'", timeout=10, silent=True)
    
    # Start new process
    ssh_exec(client, 
        f"cd {REMOTE_DIR}/server && nohup node dist/index.js > /tmp/api_v4.log 2>&1 & echo 'started'",
        timeout=15, silent=False)
    
    time.sleep(5)
    
    # Step 4: Verify API is running
    print("\n--- [4] Verify API running ---")
    for attempt in range(5):
        result, _, code = ssh_exec(client, 
            "curl -s http://localhost:3001/api/health 2>/dev/null | head -c 200 || echo 'not_ready'",
            timeout=10, silent=True)
        if 'ok' in result.lower() or '200' in result or 'health' in result.lower():
            print(f"  API is running! (attempt {attempt+1})")
            break
        print(f"  Waiting... (attempt {attempt+1})")
        time.sleep(3)
    
    # Step 5: Test OAuth platforms endpoint
    print("\n--- [5] Test OAuth platforms ---")
    result, _, _ = ssh_exec(client, 
        "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null | python3 -m json.tool 2>/dev/null | head -60",
        timeout=15, silent=False)
    
    # Check if recruitment platforms appear
    if 'boss' in result or 'zhilian' in result:
        print("\n  Recruitment platforms detected in API response!")
    else:
        print("\n  Recruitment platforms NOT in response - may need oauth.ts update too")
    
    # Step 6: Check web frontend
    print("\n--- [6] Check web status ---")
    ssh_exec(client, f"ls -la {REMOTE_DIR}/web/.next/ 2>/dev/null | head -3 || echo 'no .next dir'", timeout=10)
    ssh_exec(client, "ps aux | grep 'next' | grep -v grep | head -3", timeout=10)
    
    # Step 7: Test a real OAuth session creation attempt
    print("\n--- [7] Test OAuth session creation ---")
    result, _, _ = ssh_exec(client, 
        "curl -s -X POST http://localhost:3001/api/oauth/sessions -H 'Content-Type: application/json' -d '{\"platform\":\"douyin\",\"userId\":\"test_user\"}' 2>/dev/null | head -c 500",
        timeout=30, silent=False)
    
    print("\n" + "=" * 60)
    print("DEPLOY V4 COMPLETE")
    print("=" * 60)
    client.close()

if __name__ == '__main__':
    main()
