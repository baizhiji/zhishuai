"""Force restart the API service with new V4 code"""
import paramiko
import time

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_DIR = '/var/www/zhishuai'

def ssh_exec(client, cmd, timeout=30):
    print(f"[SSH] {cmd[:120]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out[-2000:].encode('ascii', errors='replace').decode('ascii'))
    if code != 0 and err.strip():
        print(f"  ERR: {err[-500:].encode('ascii', errors='replace').decode('ascii')}")
    return out, err, code

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # Step 1: Find all node processes using port 3001
    print("--- [1] Find processes on port 3001 ---")
    ssh_exec(client, "lsof -i :3001 2>/dev/null || ss -tlnp | grep 3001 || echo 'port check done'", timeout=10)
    ssh_exec(client, "ps aux | grep 'node.*zhishuai' | grep -v grep", timeout=10)

    # Step 2: Force kill all node processes for zhishuai
    print("\n--- [2] Kill all zhishuai node processes ---")
    # Kill all node processes running zhishuai server
    ssh_exec(client, "pkill -9 -f 'node.*zhishuai/server/dist' 2>/dev/null || echo 'no process found'", timeout=10)
    ssh_exec(client, "pkill -9 -f 'node.*zhishuai/server' 2>/dev/null || echo 'no process'", timeout=10)
    time.sleep(3)
    
    # Verify port is free
    ssh_exec(client, "lsof -i :3001 2>/dev/null || echo 'port 3001 is free'", timeout=10)
    ssh_exec(client, "ps aux | grep 'node.*zhishuai' | grep -v grep", timeout=10)

    # Step 3: Start new API process
    print("\n--- [3] Start new API process ---")
    # Check if PM2 is managing it
    ssh_exec(client, "pm2 list 2>/dev/null | grep zhishuai || echo 'no pm2 entry'", timeout=10)
    
    # Try using pm2 if available, otherwise raw nohup
    out, _, _ = ssh_exec(client, "which pm2 2>/dev/null || echo 'no pm2'", timeout=5)
    
    if 'pm2' in out and 'no pm2' not in out:
        print("  Using PM2 to restart...")
        ssh_exec(client, f"cd {REMOTE_DIR}/server && pm2 start dist/index.js --name zhishuai-api 2>/dev/null || pm2 restart zhishuai-api 2>/dev/null", timeout=30)
    else:
        print("  Using nohup to start...")
        ssh_exec(client, 
            f"cd {REMOTE_DIR}/server && nohup node dist/index.js > /tmp/api_v4_restart.log 2>&1 & echo $!",
            timeout=15)
    
    time.sleep(5)

    # Step 4: Verify API is running with V4 code
    print("\n--- [4] Verify API running ---")
    for attempt in range(8):
        out, _, _ = ssh_exec(client, 
            "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); print('platforms:', len(d.get('data',[])), ', has boss:', 'boss' in str(d))\" 2>/dev/null || echo 'not ready'",
            timeout=10, silent=True)
        if 'boss' in out and 'true' in out.lower():
            print(f"  API running with V4 code! (attempt {attempt+1})")
            print(f"  {out.encode('ascii', errors='replace').decode('ascii')}")
            break
        print(f"  Waiting... (attempt {attempt+1}): {out.encode('ascii', errors='replace').decode('ascii')[:100]}")
        time.sleep(3)

    # Step 5: Double-check V4 code features in running process
    print("\n--- [5] Confirm V4 code is active ---")
    # Check the loaded module by verifying smartFindQRCode exists
    ssh_exec(client, f"grep -c 'smartFindQRCode' {REMOTE_DIR}/server/dist/services/browser-auth.service.js", timeout=5)
    ssh_exec(client, f"grep -c 'successUrlPatterns' {REMOTE_DIR}/server/dist/services/browser-auth.service.js", timeout=5)
    
    # Step 6: Verify process is running
    print("\n--- [6] Final process check ---")
    ssh_exec(client, "ps aux | grep 'node.*zhishuai' | grep -v grep", timeout=10)
    
    # Step 7: Check if the recruitment page on web needs updating
    print("\n--- [7] Need to update web? ---")
    # Check current recruitment platforms page source (compiled)
    ssh_exec(client, f"grep -c 'oauth/initiate' {REMOTE_DIR}/web/.next/server/app/customer/recruitment/platforms/auto.rsc 2>/dev/null || echo 'no initiate call'", timeout=5)
    ssh_exec(client, f"grep -c 'oauth/sessions' {REMOTE_DIR}/web/.next/server/app/customer/recruitment/platforms/auto.rsc 2>/dev/null || echo 'no sessions call'", timeout=5)
    # Check the actual source page.tsx
    ssh_exec(client, f"grep 'oauth/initiate' {REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx 2>/dev/null || echo 'not found'", timeout=5)
    ssh_exec(client, f"grep 'oauth/sessions' {REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx 2>/dev/null || echo 'not found'", timeout=5)

    client.close()
    print("\nRestart complete!")

if __name__ == '__main__':
    main()
